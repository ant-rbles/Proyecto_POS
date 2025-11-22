using Login_Análisis.Data;
using Login_Análisis.DTOs;
using Login_Análisis.Models;
using Microsoft.EntityFrameworkCore;
using System.Numerics;

namespace Login_Análisis.Services
{
    public class ProductoService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPdfService _pdfService;

        public ProductoService(ApplicationDbContext context, IPdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        public ApplicationDbContext Context => _context;

        // Métodos para Usuarios
        public async Task<User> ObtenerUsuario(int idUsuario)
        {
            return await Context.Users.FirstOrDefaultAsync(u => u.Id == idUsuario);
        }

        public async Task<Compra> ObtenerCompraPorId(int id)
        {
            return await Context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.UsuarioCreacionNavigation)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        // Métodos para Proveedores
        public async Task<List<Proveedor>> ObtenerTodosProveedoresAsync()
        {
            return await _context.Proveedores
                .ToListAsync();
        }
        public async Task<List<Proveedor>> ObtenerProveedoresActivosAsync()
        {
            return await _context.Proveedores
                .Where(p => p.Estado)
                .ToListAsync();
        }
        public async Task<Proveedor> ObtenerProveedor(int id)
        {
            return await _context.Proveedores.FindAsync(id);
        }
        public async Task<Proveedor> ObtenerProveedorPorRUC(string ruc)
        {
            return await _context.Proveedores
                .FirstOrDefaultAsync(p => p.RUC == ruc && p.Estado);
        }

        public async Task<(bool success, string message)> CrearProveedor(Proveedor proveedor)
        {
            try
            {
                // Verificar si ya existe un proveedor con el mismo RUC
                if (await _context.Proveedores.AnyAsync(p => p.RUC == proveedor.RUC))
                {
                    return (false, "Ya existe un proveedor con este RUC");
                }

                _context.Proveedores.Add(proveedor);
                await _context.SaveChangesAsync();
                return (true, "Proveedor creado exitosamente");
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}");
            }
        }

        // Métodos para Unidades de Medida
        public async Task<List<UnidadMedida>> ObtenerUnidadesMedida()
        {
            return await _context.UnidadesMedida
                .Where(u => u.Estado)
                .OrderBy(u => u.Nombre)
                .ToListAsync();
        }

        public async Task<UnidadMedida> ObtenerUnidadBase()
        {
            return await _context.UnidadesMedida
                .FirstOrDefaultAsync(u => u.EsUnidadBase && u.Estado);
        }

        public async Task<UnidadMedida> ObtenerUnidadMedida(int id)
        {
            return await _context.UnidadesMedida.FindAsync(id);
        }

        // Métodos para Productos

        public async Task<(bool success, string message)> CrearProducto(Producto producto)
        {
            try
            {
                // Validaciones básicas
                if (string.IsNullOrWhiteSpace(producto.Codigo))
                    return (false, "El código del producto es requerido");

                if (string.IsNullOrWhiteSpace(producto.Nombre))
                    return (false, "El nombre del producto es requerido");

                // Verificar duplicados
                if (await _context.Productos.AnyAsync(p => p.Codigo == producto.Codigo && p.Estado))
                    return (false, "Ya existe un producto con este código");

                // Asegurar valores por defecto
                producto.StockActual = producto.StockActual >= 0 ? producto.StockActual : 0;
                producto.PrecioCostoPromedio = producto.PrecioCostoPromedio >= 0 ? producto.PrecioCostoPromedio : 0;
                producto.PrecioVenta = producto.PrecioVenta >= 0 ? producto.PrecioVenta : 0;
                producto.Estado = true;

                _context.Productos.Add(producto);
                await _context.SaveChangesAsync();
                return (true, "Producto creado exitosamente");
            }
            catch (Exception ex)
            {
                return (false, $"Error al crear producto: {ex.Message}");
            }
        }

        public async Task<List<Producto>> ObtenerTodosProductosAsync()
        {
            return await _context.Productos
                .Include(p => p.Proveedor)
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .ToListAsync();
        }

        public async Task<List<Producto>> ObtenerProductosActivosAsync()
        {
            return await _context.Productos
                .Where(p => p.Estado)
                .Include(p => p.Proveedor)
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .ToListAsync();
        }

        public async Task<Producto> ObtenerProducto(int id)
        {
            return await _context.Productos
                .Include(p => p.Proveedor)
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Producto> ObtenerProductoPorCodigo(string codigo)
        {
            return await _context.Productos
                .Include(p => p.UnidadMedidaBase)
                .FirstOrDefaultAsync(p => p.Codigo == codigo && p.Estado);
        }
        public async Task<List<Producto>> ObtenerProductosPorProveedorAsync(int proveedorId)
        {
            return await _context.Productos
                .Where(p => p.ProveedorId == proveedorId && p.Estado)
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .ToListAsync();
        }

        //Metodo para convertir unidades de medida
        public async Task<decimal> ConvertirUnidad(int desdeUnidadId, int aUnidadId, decimal cantidad)
        {
            try
            {
                var unidadDesde = await _context.UnidadesMedida.FindAsync(desdeUnidadId);
                var unidadHacia = await _context.UnidadesMedida.FindAsync(aUnidadId);

                if (unidadDesde == null || unidadHacia == null)
                {
                    throw new Exception("Unidades de medida no encontradas");
                }

                if (!unidadDesde.Estado || !unidadHacia.Estado)
                {
                    throw new Exception("Una o ambas unidades de medida están inactivas");
                }

                // Convertir a unidad base primero, luego a la unidad destino
                var cantidadBase = cantidad * unidadDesde.FactorConversion;
                var cantidadConvertida = cantidadBase / unidadHacia.FactorConversion;

                return cantidadConvertida;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error al convertir unidades: {ex.Message}");
            }
        }
        // Métodos para Compras
        public async Task<(bool success, string message, Compra compra)> CrearCompra(Compra compra, List<DetalleCompra> detalles)
        {
            using var transaction = await Context.Database.BeginTransactionAsync();
            try
            {
                // Guardamos la compra (aún sin totales)
                Context.Compras.Add(compra);
                await Context.SaveChangesAsync();

                decimal subtotal = 0;

                foreach (var detalle in detalles)
                {
                    var producto = await Context.Productos.FindAsync(detalle.ProductoId);
                    if (producto == null)
                        return (false, "Producto no válido", null);

                    // Calcular total de la línea
                    detalle.TotalLinea = detalle.Cantidad * detalle.PrecioUnitario;
                    detalle.CompraId = compra.Id;

                    // Sumar al subtotal
                    subtotal += detalle.TotalLinea;

                    Context.DetalleCompras.Add(detalle);

                    // Guardar el stock anterior antes de actualizar
                    var stockAnterior = producto.StockActual;

                    // 🔹 Actualizar inventario (dejamos tu lógica intacta)
                    producto.StockActual += detalle.Cantidad;

                    // Recalcular costo promedio (promedio ponderado)
                    var valorInventarioAnterior = stockAnterior * producto.PrecioCostoPromedio;
                    var valorNuevaCompra = detalle.Cantidad * detalle.PrecioUnitario;

                    producto.PrecioCostoPromedio = (valorInventarioAnterior + valorNuevaCompra) / producto.StockActual;

                    // Recalcular precio de venta según margen
                    producto.PrecioVenta = producto.PrecioCostoPromedio * (1 + (producto.MargenGanancia / 100m));

                    producto.FechaActualizacion = DateTime.UtcNow;

                    // 🔹 Registrar movimiento de inventario
                    var movimiento = new MovimientoInventario
                    {
                        ProductoId = producto.Id,
                        TipoMovimiento = "ENTRADA",
                        Cantidad = detalle.Cantidad, // No tocamos la conversión
                        CantidadAnterior = stockAnterior,
                        CantidadNueva = producto.StockActual,
                        PrecioCosto = producto.PrecioCostoPromedio,
                        PrecioVenta = producto.PrecioVenta,
                        ReferenciaId = compra.Id,
                        ReferenciaTipo = "COMPRA",
                        Observaciones = $"Compra factura {compra.NumeroFactura ?? "Sin factura"}",
                        UsuarioId = compra.UsuarioCreacion,
                        FechaMovimiento = DateTime.UtcNow
                    };

                    Context.MovimientosInventario.Add(movimiento);
                }

                // Totales
                compra.Subtotal = subtotal;
                compra.Impuestos = subtotal * 0.12m;
                compra.Total = compra.Subtotal + compra.Impuestos;

                await Context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Compra registrada correctamente", compra);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error al registrar la compra: {ex.Message}", null);
            }
        }

        private async Task ActualizarInventarioProducto(Producto producto, DetalleCompra detalle)
        {
            var cantidadAnterior = producto.StockActual;

            // Calcular nuevo precio costo promedio (promedio ponderado)
            var valorInventarioAnterior = producto.StockActual * producto.PrecioCostoPromedio;
            var valorNuevaCompra = detalle.CantidadBase * (detalle.PrecioUnitario / detalle.UnidadMedida.FactorConversion);

            producto.StockActual += detalle.CantidadBase;
            producto.PrecioCostoPromedio = (valorInventarioAnterior + valorNuevaCompra) / producto.StockActual;

            // Calcular nuevo precio de venta
            producto.PrecioVenta = producto.PrecioCostoPromedio * (1 + (producto.MargenGanancia / 100));
            producto.FechaActualizacion = DateTime.UtcNow;

            // Registrar movimiento de inventario
            var movimiento = new MovimientoInventario
            {
                ProductoId = producto.Id,
                TipoMovimiento = "ENTRADA",
                Cantidad = detalle.CantidadBase,
                CantidadAnterior = cantidadAnterior,
                CantidadNueva = producto.StockActual,
                PrecioCosto = producto.PrecioCostoPromedio,
                PrecioVenta = producto.PrecioVenta,
                ReferenciaId = detalle.CompraId,
                ReferenciaTipo = "COMPRA",
                Observaciones = $"Compra factura {detalle.Compra?.NumeroFactura}",
                UsuarioId = detalle.Compra?.UsuarioCreacion,
                FechaMovimiento = DateTime.UtcNow
            };

            _context.MovimientosInventario.Add(movimiento);
        }

        public async Task<Compra> ObtenerCompra(int id)
        {
            return await _context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Compra> ObtenerCompraPorNumeroFactura(string numeroFactura)
        {
            return await _context.Compras
                .FirstOrDefaultAsync(c => c.NumeroFactura == numeroFactura);
        }

        public async Task<Compra> ObtenerUltimaCompra()
        {
            return await _context.Compras
                .OrderByDescending(c => c.Id)
                .FirstOrDefaultAsync();
        }

        public async Task<List<Compra>> ObtenerCompras()
        {
            return await ObtenerCompras(null, null, null);
        }

        public async Task<List<Compra>> ObtenerCompras(DateTime? fechaInicio, DateTime? fechaFin)
        {
            return await ObtenerCompras(fechaInicio, fechaFin, null);
        }

        // ✅ Método principal (el que realmente ejecuta la consulta)
        public async Task<List<Compra>> ObtenerCompras(DateTime? fechaInicio, DateTime? fechaFin, string? estado)
        {
            var query = Context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.Detalles).ThenInclude(d => d.Producto)
                .Include(c => c.Detalles).ThenInclude(d => d.UnidadMedida)
                .AsQueryable();

            if (fechaInicio.HasValue)
                query = query.Where(c => c.FechaCompra >= fechaInicio.Value);

            if (fechaFin.HasValue)
                query = query.Where(c => c.FechaCompra <= fechaFin.Value);

            if (!string.IsNullOrEmpty(estado))
                query = query.Where(c => c.Estado == estado);

            return await query.OrderByDescending(c => c.FechaCompra).ToListAsync();
        }
        public async Task<(bool success, string message)> CambiarEstadoCompra(int compraId, string estado)
        {
            try
            {
                var compra = await _context.Compras.FindAsync(compraId);
                if (compra == null)
                    return (false, "Compra no encontrada");

                compra.Estado = estado;
                await _context.SaveChangesAsync();

                return (true, $"Estado de compra actualizado a {estado}");
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}");
            }
        }

        public async Task<byte[]> GenerarFacturaCompraPdf(int compraId)
        {
            return await _pdfService.GenerarFacturaCompra(compraId);
        }

        public async Task<(bool success, string message)> AnularCompra(int compraId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var compra = await _context.Compras
                    .Include(c => c.Detalles)
                    .FirstOrDefaultAsync(c => c.Id == compraId);

                if (compra == null)
                    return (false, "Compra no encontrada");

                if (compra.Estado == "ANULADA")
                    return (false, "La compra ya está anulada");

                // Revertir el inventario para cada detalle
                foreach (var detalle in compra.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    if (producto != null)
                    {
                        // Revertir el stock
                        producto.StockActual -= detalle.CantidadBase;

                        // Registrar movimiento de reversión
                        var movimiento = new MovimientoInventario
                        {
                            ProductoId = producto.Id,
                            TipoMovimiento = "REVERSION_COMPRA",
                            Cantidad = detalle.CantidadBase,
                            CantidadAnterior = producto.StockActual + detalle.CantidadBase,
                            CantidadNueva = producto.StockActual,
                            PrecioCosto = producto.PrecioCostoPromedio,
                            PrecioVenta = producto.PrecioVenta,
                            ReferenciaId = compraId,
                            ReferenciaTipo = "ANULACION_COMPRA",
                            Observaciones = $"Compra anulada - {compra.NumeroFactura}",
                            UsuarioId = compra.UsuarioCreacion,
                            FechaMovimiento = DateTime.UtcNow
                        };

                        _context.MovimientosInventario.Add(movimiento);
                    }
                }

                compra.Estado = "ANULADA";
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Compra anulada exitosamente y stock revertido");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error al anular compra: {ex.Message}");
            }
        }

        // Métodos para Ventas
        public async Task<(bool success, string message, Venta venta)> CrearVenta(VentaRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 🔹 Validación inicial
                if (request.Detalles == null || !request.Detalles.Any())
                {
                    return (false, "Debe incluir al menos un producto en la venta", null);
                }

                foreach (var detalle in request.Detalles)
                {
                    if (detalle.ProductoId <= 0)
                        return (false, "Producto no válido en el detalle de venta", null);

                    // Evita errores si el frontend no manda unidad
                    if (detalle.UnidadMedidaId <= 0)
                        detalle.UnidadMedidaId = 1; // ⚙️ fallback a la unidad base por defecto (id=1)

                    if (detalle.Cantidad <= 0)
                        return (false, "La cantidad del producto debe ser mayor a 0", null);
                }

                // 🔹 Generar número de factura automático
                var numeroFactura = GenerarNumeroFactura();

                // 🔹 Crear entidad Venta
                var venta = new Venta
                {
                    NumeroFactura = numeroFactura,
                    FechaVenta = request.FechaVenta,
                    ClienteId = request.ClienteId,
                    NombreCliente = request.NombreCliente,
                    NITCliente = request.NITCliente,
                    DescuentoGlobal = request.DescuentoGlobal,
                    AplicarIVA = request.AplicarIVA,
                    Observaciones = request.Observaciones,
                    UsuarioCreacion = request.UsuarioCreacion,
                    MetodoPago = request.MetodoPago ?? "Efectivo",
                    FechaCreacion = DateTime.UtcNow,
                    Estado = "COMPLETADA"
                };

                // 🔹 Calcular totales
                decimal subtotal = 0;
                var detalles = new List<DetalleVenta>();

                foreach (var detalleRequest in request.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(detalleRequest.ProductoId);
                    if (producto == null)
                        return (false, $"Producto con ID {detalleRequest.ProductoId} no encontrado", null);

                    var unidadMedida = await _context.UnidadesMedida.FindAsync(detalleRequest.UnidadMedidaId)
                                        ?? await _context.UnidadesMedida.FirstOrDefaultAsync(u => u.Id == producto.UnidadMedidaBaseId)
                                        ?? await _context.UnidadesMedida.FirstOrDefaultAsync();

                    if (unidadMedida == null)
                        return (false, "Unidad de medida no encontrada", null);

                    // ⚙️ Conversión a unidad base
                    var cantidadBase = detalleRequest.Cantidad * unidadMedida.FactorConversion;

                    // ⚙️ Precio fijo (no editable)
                    var precioUnitario = producto.PrecioVenta;

                    // ⚙️ Descuento (si aplica)
                    var precioConDescuento = precioUnitario * (1 - (detalleRequest.DescuentoAplicado / 100));
                    var totalLinea = detalleRequest.Cantidad * precioConDescuento;
                    subtotal += totalLinea;

                    var detalle = new DetalleVenta
                    {
                        ProductoId = detalleRequest.ProductoId,
                        UnidadMedidaId = unidadMedida.Id,
                        Cantidad = detalleRequest.Cantidad,
                        CantidadBase = cantidadBase,
                        PrecioUnitario = precioConDescuento,
                        DescuentoAplicado = detalleRequest.DescuentoAplicado,
                        TotalLinea = totalLinea
                    };

                    detalles.Add(detalle);
                }

                // 🔹 Calcular descuentos e impuestos
                venta.Subtotal = subtotal - request.DescuentoGlobal;
                venta.Impuestos = request.AplicarIVA ? venta.Subtotal * 0.12m : 0; // 12% IVA
                venta.Total = venta.Subtotal + venta.Impuestos;

                // 🔹 Guardar venta principal
                _context.Venta.Add(venta);
                await _context.SaveChangesAsync();

                // 🔹 Guardar detalles y actualizar stock
                foreach (var detalle in detalles)
                {
                    detalle.VentaId = venta.Id;
                    _context.DetalleVenta.Add(detalle);

                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    if (producto != null)
                        await ActualizarInventarioVenta(producto, detalle);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Venta registrada exitosamente", venta);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                // 🔹 Si es un error conocido de validación
                if (ex.Message.Contains("no encontrado") || ex.Message.Contains("inexistente"))
                {
                    return (false, $"Datos inválidos: {ex.Message}", null);
                }

                // 🔹 Error inesperado (mantiene trazabilidad)
                return (false, $"Error interno: {ex.Message}", null);
            }
        }

        private async Task<decimal> CalcularDescuentoPorCantidad(int productoId, decimal cantidad)
        {
            var descuentos = await _context.DescuentosProducto
                .Where(d => d.ProductoId == productoId && d.Estado && d.CantidadMinima <= cantidad)
                .OrderByDescending(d => d.CantidadMinima)
                .ToListAsync();

            return descuentos.FirstOrDefault()?.PorcentajeDescuento ?? 0;
        }

        private async Task ActualizarInventarioVenta(Producto producto, DetalleVenta detalle)
        {
            var cantidadAnterior = producto.StockActual;

            // Verificar stock suficiente
            if (producto.StockActual < detalle.CantidadBase)
            {
                throw new Exception($"Stock insuficiente para el producto {producto.Nombre}. Stock actual: {producto.StockActual}, Se requiere: {detalle.CantidadBase}");
            }

            // Reducir stock
            producto.StockActual -= detalle.CantidadBase;
            producto.FechaActualizacion = DateTime.UtcNow;

            // Registrar movimiento de inventario
            var movimiento = new MovimientoInventario
            {
                ProductoId = producto.Id,
                TipoMovimiento = "SALIDA",
                Cantidad = detalle.CantidadBase,
                CantidadAnterior = cantidadAnterior,
                CantidadNueva = producto.StockActual,
                PrecioCosto = producto.PrecioCostoPromedio,
                PrecioVenta = detalle.PrecioUnitario,
                ReferenciaId = detalle.VentaId,
                ReferenciaTipo = "VENTA",
                Observaciones = $"Venta factura {detalle.Venta?.NumeroFactura}",
                UsuarioId = detalle.Venta?.UsuarioCreacion,
                FechaMovimiento = DateTime.UtcNow
            };

            _context.MovimientosInventario.Add(movimiento);
        }

        public async Task<List<Venta>> ObtenerVentas(DateTime? fechaInicio = null, DateTime? fechaFin = null, string? estado = null)
        {
            var query = _context.Venta
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .Include(v => v.Cliente)
                .Include(v => v.Usuario)
                .AsQueryable();

            // FILTRO FECHA INICIO
            if (fechaInicio.HasValue)
            {
                query = query.Where(v => v.FechaVenta >= fechaInicio.Value.Date);
            }

            // FILTRO FECHA FIN CORRECTO (fin +1 día)
            if (fechaFin.HasValue)
            {
                var fin = fechaFin.Value.Date.AddDays(1);
                query = query.Where(v => v.FechaVenta < fin);
            }

            if (!string.IsNullOrEmpty(estado))
            {
                query = query.Where(v => v.Estado == estado);
            }

            return await query
                .OrderByDescending(v => v.FechaVenta)
                .ToListAsync();
        }

        public async Task<(bool success, string message)> CambiarEstadoVenta(int ventaId, string estado)
        {
            try
            {
                var venta = await _context.Venta.FindAsync(ventaId);
                if (venta == null)
                    return (false, "Venta no encontrada");

                venta.Estado = estado;
                await _context.SaveChangesAsync();

                return (true, $"Estado de venta actualizado a {estado}");
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}");
            }
        }

        public async Task<object?> ObtenerVenta(int id)
        {
            var venta = await _context.Venta
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(v => v.Usuario)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (venta == null)
                return null;

            return new
            {
                venta.Id,
                venta.NumeroFactura,
                venta.FechaVenta,
                venta.NombreCliente,
                venta.NITCliente,
                venta.DescuentoGlobal,
                venta.AplicarIVA,
                venta.MetodoPago,
                venta.Subtotal,
                venta.Impuestos,
                venta.Total,

                UsuarioCreacionNombre = venta.Usuario != null
                 ? $"{venta.Usuario.Nombre} {venta.Usuario.Usuario}"
                 : "Desconocido",

                Detalles = venta.Detalles.Select(d => new
                {
                    d.Id,
                    d.ProductoId,
                    ProductoNombre = d.Producto.Nombre,
                    d.Cantidad,
                    d.PrecioUnitario,
                    d.DescuentoAplicado,
                    TotalLinea = d.TotalLinea
                }).ToList()
            };
        }

        // Métodos para Categorías
        public async Task<List<Categoria>> ObtenerCategorias()
        {
            return await _context.Categorias
                .Where(c => c.Estado)
                .OrderBy(c => c.Nombre)
                .ToListAsync();
        }

        public async Task<Categoria> ObtenerCategoria(int id)
        {
            return await _context.Categorias.FindAsync(id);
        }

        public async Task<Categoria> ObtenerCategoriaPorNombre(string nombre)
        {
            return await _context.Categorias
                .FirstOrDefaultAsync(c => c.Nombre == nombre && c.Estado);
        }

        public async Task<(bool success, string message)> CrearCategoria(Categoria categoria)
        {
            try
            {
                _context.Categorias.Add(categoria);
                await _context.SaveChangesAsync();
                return (true, "Categoría creada exitosamente");
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}");
            }
        }

        // Métodos para Clientes
        public async Task<List<Cliente>> ObtenerTodosClientesAsync()
        {
            return await _context.Clientes
                .OrderBy(c => c.Nombre)
                .ToListAsync();
        }

        public async Task<Cliente> ObtenerCliente(int id)
        {
            return await _context.Clientes.FindAsync(id);
        }

        public async Task<Cliente> ObtenerClientePorNIT(string nit)
        {
            return await _context.Clientes
                .FirstOrDefaultAsync(c => c.NIT == nit && c.Estado);
        }

        public async Task<(bool success, string message)> CrearCliente(Cliente cliente)
        {
            try
            {
                // Verificar si ya existe un cliente con el mismo NIT
                if (await _context.Clientes.AnyAsync(c => c.NIT == cliente.NIT))
                {
                    return (false, "Ya existe un cliente con este NIT");
                }

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();
                return (true, "Cliente creado exitosamente");
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}");
            }
        }

        // MÉTODO PARA GENERAR NÚMERO DE FACTURA
        private string GenerarNumeroFactura()
        {
            var ultimaVenta = _context.Venta
                .Where(v => v.NumeroFactura.StartsWith("FAC-"))
                .OrderByDescending(v => v.Id)
                .FirstOrDefault();

            var numero = 1;
            if (ultimaVenta != null)
            {
                var partes = ultimaVenta.NumeroFactura.Split('-');
                if (partes.Length > 1 && int.TryParse(partes[1], out int ultimoNumero))
                {
                    numero = ultimoNumero + 1;
                }
            }

            return $"FAC-{numero:000000}";
        }

        //Métodos para Membresías
        public async Task<(bool success, string message, Membresia membresia)> CrearMembresia(MembresiaRequest req, int usuarioId)
        {
            // Validaciones mínimas
            if (req.FechaVencimiento < req.FechaInicio)
                return (false, "La fecha de vencimiento no puede ser anterior a la fecha de inicio", null);

            if (req.MontoPagado < 0)
                return (false, "El monto pagado no puede ser negativo", null);

            // verificar código único
            var existe = await Context.Membresias.AnyAsync(m => m.Codigo == req.Codigo);
            if (existe)
                return (false, "Código de membresía ya existe", null);

            // validar teléfono (mínimo 8 dígitos si viene)
            if (!string.IsNullOrEmpty(req.TelefonoContacto))
            {
                var digitos = new string(req.TelefonoContacto.Where(char.IsDigit).ToArray());
                if (digitos.Length < 8)
                    return (false, "Teléfono de contacto inválido (mínimo 8 dígitos)", null);
            }

            var membresia = new Membresia
            {
                Codigo = req.Codigo,
                NombreCliente = req.NombreCliente,
                ClienteId = req.ClienteId,
                Tipo = req.Tipo,
                FechaInicio = req.FechaInicio,
                FechaVencimiento = req.FechaVencimiento,
                Estado = "Activa",
                MontoPagado = req.MontoPagado,
                MetodoPago = req.MetodoPago,
                TelefonoContacto = req.TelefonoContacto,
                UsuarioCreacionId = usuarioId,
                FechaCreacion = DateTime.UtcNow
            };

            Context.Membresias.Add(membresia);
            await Context.SaveChangesAsync();

            // registrar operación
            var op = new MembresiaOperacion
            {
                MembresiaId = membresia.Id,
                Accion = "Creación",
                UsuarioId = usuarioId,
                Fecha = DateTime.UtcNow,
                Detalle = "Membresía creada"
            };

            Context.MembresiaOperaciones.Add(op);
            await Context.SaveChangesAsync();

            return (true, "Membresía creada", membresia);
        }

        public async Task<List<Membresia>> ObtenerMembresiasPorUsuario(int usuarioId)
        {
            // Si quieres devolver todas para admin, o filtrar por creador según necesidad.
            return await Context.Membresias
                .Include(m => m.Operaciones)
                .OrderByDescending(m => m.FechaCreacion)
                .ToListAsync();
        }

        public async Task<Membresia> ObtenerMembresia(int id)
        {
            return await Context.Membresias
                .Include(m => m.Operaciones)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<(bool success, string message)> ModificarMembresia(int id, MembresiaRequest req, int usuarioId)
        {
            var m = await Context.Membresias.FindAsync(id);
            if (m == null) return (false, "Membresía no encontrada");

            if (m.Estado == "Cancelada") return (false, "No se permiten operaciones sobre membresías canceladas");

            if (req.FechaVencimiento < req.FechaInicio)
                return (false, "La fecha de vencimiento no puede ser anterior a la fecha de inicio");

            if (req.MontoPagado < 0)
                return (false, "El monto pagado no puede ser negativo");

            var telefono = req.TelefonoContacto ?? "";
            var digitos = new string(telefono.Where(char.IsDigit).ToArray());
            if (!string.IsNullOrEmpty(telefono) && digitos.Length < 8)
                return (false, "Teléfono de contacto inválido (mínimo 8 dígitos)");

            // Actualizar campos permitidos
            m.NombreCliente = req.NombreCliente;
            m.Tipo = req.Tipo;
            m.FechaInicio = req.FechaInicio;
            m.FechaVencimiento = req.FechaVencimiento;
            m.MontoPagado = req.MontoPagado;
            m.MetodoPago = req.MetodoPago;
            m.TelefonoContacto = req.TelefonoContacto;
            m.UsuarioUltimaAccionId = usuarioId;
            m.FechaUltimaAccion = DateTime.UtcNow;

            await Context.SaveChangesAsync();

            Context.MembresiaOperaciones.Add(new MembresiaOperacion
            {
                MembresiaId = m.Id,
                Accion = "Modificación",
                UsuarioId = usuarioId,
                Fecha = DateTime.UtcNow,
                Detalle = "Datos modificados"
            });

            await Context.SaveChangesAsync();
            return (true, "Membresía actualizada");
        }

        public async Task<(bool success, string message)> CambiarEstadoMembresia(int id, string nuevoEstado, int usuarioId)
        {
            var m = await Context.Membresias.FindAsync(id);
            if (m == null) return (false, "Membresía no encontrada");

            // gobierno de estados simple: Solo Admin puede cancelar/reactivar
            if (m.Estado == "Cancelada" && nuevoEstado != "Activa")
                return (false, "Solo se puede reactivar una membresía cancelada");

            // actualizar
            m.Estado = nuevoEstado;
            m.UsuarioUltimaAccionId = usuarioId;
            m.FechaUltimaAccion = DateTime.UtcNow;
            await Context.SaveChangesAsync();

            Context.MembresiaOperaciones.Add(new MembresiaOperacion
            {
                MembresiaId = m.Id,
                Accion = $"CambioEstado:{nuevoEstado}",
                UsuarioId = usuarioId,
                Fecha = DateTime.UtcNow,
                Detalle = $"Estado cambiado a {nuevoEstado}"
            });
            await Context.SaveChangesAsync();

            return (true, "Estado cambiado");
        }

        // Métodos para Presupuestos
        public async Task<(bool success, string message, PresupuestoResponse presupuesto)> CrearPresupuesto(PresupuestoRequest request, int usuarioId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validar que el vendedor exista
                var vendedor = await _context.Users.FindAsync(usuarioId);
                if (vendedor == null)
                    return (false, "Vendedor no encontrado", null);

                // Generar número de presupuesto
                var numeroPresupuesto = await GenerarNumeroPresupuesto();

                // Crear entidad Presupuesto
                var presupuesto = new Presupuesto
                {
                    NumeroPresupuesto = numeroPresupuesto,
                    FechaPresupuesto = request.FechaPresupuesto,
                    FechaVencimiento = request.FechaVencimiento,
                    ClienteId = request.ClienteId,
                    NombreCliente = request.NombreCliente,
                    NITCliente = request.NITCliente,
                    DireccionCliente = request.DireccionCliente,
                    Observaciones = request.Observaciones,
                    UsuarioCreacion = usuarioId,
                    FechaCreacion = DateTime.UtcNow,
                    Estado = "PENDIENTE"
                };

                // Calcular totales
                decimal subtotal = 0;
                var detalles = new List<DetallePresupuesto>();

                foreach (var detalleRequest in request.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(detalleRequest.ProductoId);
                    if (producto == null)
                        return (false, $"Producto con ID {detalleRequest.ProductoId} no encontrado", null);

                    var unidadMedida = await _context.UnidadesMedida.FindAsync(detalleRequest.UnidadMedidaId);
                    if (unidadMedida == null)
                        return (false, "Unidad de medida no encontrada", null);

                    // Aplicar descuento
                    var precioConDescuento = detalleRequest.PrecioUnitario * (1 - (detalleRequest.DescuentoAplicado / 100));
                    var totalLinea = detalleRequest.Cantidad * precioConDescuento;
                    subtotal += totalLinea;

                    var detalle = new DetallePresupuesto
                    {
                        ProductoId = detalleRequest.ProductoId,
                        UnidadMedidaId = unidadMedida.Id,
                        Cantidad = detalleRequest.Cantidad,
                        PrecioUnitario = precioConDescuento,
                        DescuentoAplicado = detalleRequest.DescuentoAplicado,
                        TotalLinea = totalLinea,
                        Observaciones = detalleRequest.Observaciones
                    };

                    detalles.Add(detalle);
                }

                // Calcular impuestos y total
                presupuesto.Subtotal = subtotal;
                presupuesto.Impuestos = request.AplicarIVA ? subtotal * 0.12m : 0;
                presupuesto.Total = presupuesto.Subtotal + presupuesto.Impuestos;

                // Guardar presupuesto
                _context.Presupuestos.Add(presupuesto);
                await _context.SaveChangesAsync();

                // Guardar detalles
                foreach (var detalle in detalles)
                {
                    detalle.PresupuestoId = presupuesto.Id;
                    _context.DetallePresupuestos.Add(detalle);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Mapear a Response
                var response = await MapearPresupuestoAResponse(presupuesto);

                return (true, "Presupuesto creado exitosamente", response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error al crear presupuesto: {ex.Message}", null);
            }
        }

        private async Task<string> GenerarNumeroPresupuesto()
        {
            var ultimoPresupuesto = await _context.Presupuestos
                .OrderByDescending(p => p.Id)
                .FirstOrDefaultAsync();

            var numero = 1;
            if (ultimoPresupuesto != null && ultimoPresupuesto.NumeroPresupuesto.StartsWith("COT-"))
            {
                var partes = ultimoPresupuesto.NumeroPresupuesto.Split('-');
                if (partes.Length > 1 && int.TryParse(partes[1], out int ultimoNumero))
                {
                    numero = ultimoNumero + 1;
                }
            }

            return $"COT-{numero:000000}";
        }

        public async Task<List<PresupuestoResponse>> ObtenerPresupuestosPorVendedor(int usuarioId)
        {
            var presupuestos = await _context.Presupuestos
                .Include(p => p.Cliente)
                .Include(p => p.Usuario)
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .Where(p => p.UsuarioCreacion == usuarioId)
                .OrderByDescending(p => p.FechaCreacion)
                .ToListAsync();

            var response = new List<PresupuestoResponse>();

            foreach (var presupuesto in presupuestos)
            {
                response.Add(await MapearPresupuestoAResponse(presupuesto));
            }

            return response;
        }

        public async Task<PresupuestoResponse> ObtenerPresupuesto(int id, int usuarioId)
        {
            var presupuesto = await _context.Presupuestos
                .Include(p => p.Cliente)
                .Include(p => p.Usuario)
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioCreacion == usuarioId);

            if (presupuesto == null)
                return null;

            return await MapearPresupuestoAResponse(presupuesto);
        }

        private async Task<PresupuestoResponse> MapearPresupuestoAResponse(Presupuesto presupuesto)
        {
            var diasRestantes = (presupuesto.FechaVencimiento - DateTime.UtcNow).Days;

            return new PresupuestoResponse
            {
                Id = presupuesto.Id,
                NumeroPresupuesto = presupuesto.NumeroPresupuesto,
                FechaPresupuesto = presupuesto.FechaPresupuesto,
                FechaVencimiento = presupuesto.FechaVencimiento,
                ClienteId = presupuesto.ClienteId,
                NombreCliente = presupuesto.NombreCliente,
                NITCliente = presupuesto.NITCliente,
                DireccionCliente = presupuesto.DireccionCliente,
                Subtotal = presupuesto.Subtotal,
                Impuestos = presupuesto.Impuestos,
                Total = presupuesto.Total,
                Observaciones = presupuesto.Observaciones,
                Estado = presupuesto.Estado,
                UsuarioCreacionNombre = presupuesto.Usuario?.Nombre ?? "N/A",
                FechaCreacion = presupuesto.FechaCreacion,
                FechaAprobacion = presupuesto.FechaAprobacion,
                DiasRestantes = diasRestantes,
                Detalles = presupuesto.Detalles.Select(d => new DetallePresupuestoResponse
                {
                    Id = d.Id,
                    ProductoId = d.ProductoId,
                    ProductoNombre = d.Producto?.Nombre ?? "N/A",
                    ProductoCodigo = d.Producto?.Codigo ?? "N/A",
                    UnidadMedidaId = d.UnidadMedidaId,
                    UnidadMedidaNombre = d.UnidadMedida?.Nombre ?? "N/A",
                    UnidadMedidaAbreviatura = d.UnidadMedida?.Abreviatura ?? "N/A",
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    DescuentoAplicado = d.DescuentoAplicado,
                    TotalLinea = d.TotalLinea,
                    Observaciones = d.Observaciones
                }).ToList()
            };
        }

        public async Task<(bool success, string message)> CambiarEstadoPresupuesto(int presupuestoId, string estado, int usuarioId)
        {
            try
            {
                var presupuesto = await _context.Presupuestos
                    .FirstOrDefaultAsync(p => p.Id == presupuestoId && p.UsuarioCreacion == usuarioId);

                if (presupuesto == null)
                    return (false, "Presupuesto no encontrado");

                presupuesto.Estado = estado;
                presupuesto.FechaActualizacion = DateTime.UtcNow;

                if (estado == "APROBADO")
                    presupuesto.FechaAprobacion = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return (true, $"Presupuesto {estado.ToLower()} exitosamente");
            }
            catch (Exception ex)
            {
                return (false, $"Error al cambiar estado: {ex.Message}");
            }
        }

        public async Task<(bool success, string message, int? ventaId)> ConvertirPresupuestoEnVenta(int presupuestoId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var presupuesto = await _context.Presupuestos
                    .Include(p => p.Detalles)
                    .FirstOrDefaultAsync(p => p.Id == presupuestoId);

                if (presupuesto == null)
                    return (false, "Presupuesto no encontrado", null);

                // Crear request de venta desde el presupuesto
                var ventaRequest = new VentaRequest
                {
                    FechaVenta = DateTime.UtcNow,
                    ClienteId = presupuesto.ClienteId,
                    NombreCliente = presupuesto.NombreCliente,
                    NITCliente = presupuesto.NITCliente,
                    AplicarIVA = true,
                    Observaciones = $"Convertido desde presupuesto: {presupuesto.NumeroPresupuesto}",
                    UsuarioCreacion = presupuesto.UsuarioCreacion,
                    Detalles = presupuesto.Detalles.Select(d => new DetalleVentaRequest
                    {
                        ProductoId = d.ProductoId,
                        UnidadMedidaId = d.UnidadMedidaId,
                        Cantidad = d.Cantidad,
                        PrecioUnitario = d.PrecioUnitario,
                        DescuentoAplicado = d.DescuentoAplicado
                    }).ToList()
                };

                // Crear la venta
                var result = await CrearVenta(ventaRequest);

                if (!result.success)
                    return (false, result.message, null);

                // Actualizar estado del presupuesto
                presupuesto.Estado = "CONVERTIDO";
                presupuesto.FechaActualizacion = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return (true, "Presupuesto convertido a venta exitosamente", result.venta.Id);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error al convertir presupuesto: {ex.Message}", null);
            }
        }

        public async Task<byte[]> GenerarPresupuestoPdf(int presupuestoId, int usuarioId)
        {
            var presupuesto = await _context.Presupuestos
                .Include(p => p.Cliente)
                .Include(p => p.Usuario)
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(p => p.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .FirstOrDefaultAsync(p => p.Id == presupuestoId && p.UsuarioCreacion == usuarioId);

            if (presupuesto == null)
                return null;

            // Implementar generación de PDF similar a las facturas
            // (Puedes adaptar el código existente de PdfService)
            return await _pdfService.GenerarPresupuestoPdf(presupuesto);
        }


        // Métodos para Movimientos de Inventario
        private async Task RegistrarMovimiento(int productoId, decimal cantidad, string tipo, string? observaciones, int? usuarioId, int? referenciaId = null, string? referenciaTipo = null)
        {
            var producto = await _context.Productos.FindAsync(productoId);
            if (producto == null)
                throw new Exception("Producto no encontrado");

            var cantidadAnterior = producto.StockActual;
            producto.StockActual += cantidad;
            producto.FechaActualizacion = DateTime.UtcNow;

            var movimiento = new MovimientoInventario
            {
                ProductoId = productoId,
                TipoMovimiento = tipo,
                Cantidad = Math.Abs(cantidad),
                CantidadAnterior = cantidadAnterior,
                CantidadNueva = producto.StockActual,
                PrecioCosto = producto.PrecioCostoPromedio,
                PrecioVenta = producto.PrecioVenta,
                ReferenciaId = referenciaId,
                ReferenciaTipo = referenciaTipo,
                Observaciones = observaciones,
                UsuarioId = usuarioId,
                FechaMovimiento = DateTime.UtcNow
            };

            _context.MovimientosInventario.Add(movimiento);
            await _context.SaveChangesAsync();
        }
        public async Task<IEnumerable<MovimientoInventario>> ObtenerMovimientosInventario(
            DateTime? fechaInicio, DateTime? fechaFin, string? tipo, int? productoId = null)
        {
            var query = _context.MovimientosInventario
                .Include(m => m.Producto)
                .ThenInclude(p => p.Categoria)
                .AsQueryable();

            // 🔹 Filtros por fecha
            if (fechaInicio.HasValue)
                query = query.Where(m => m.FechaMovimiento >= fechaInicio.Value);

            if (fechaFin.HasValue)
            {
                var finDia = fechaFin.Value.Date.AddDays(1).AddSeconds(-1);
                query = query.Where(m => m.FechaMovimiento <= finDia);
            }

            // 🔹 Filtro por tipo — solo aplica si se especifica algo diferente de "TODOS"
            if (!string.IsNullOrWhiteSpace(tipo) && tipo.ToUpper() != "TODOS")
                query = query.Where(m => m.TipoMovimiento == tipo);

            // 🔹 Filtro por producto si se envía
            if (productoId.HasValue)
                query = query.Where(m => m.ProductoId == productoId.Value);

            return await query
                .OrderByDescending(m => m.FechaMovimiento)
                .ToListAsync();
        }

        public async Task<(bool success, string message)> CrearAjusteInventario(int productoId, decimal cantidad, string observaciones, int? usuarioId, string tipo)

        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var producto = await _context.Productos.FindAsync(productoId);
                if (producto == null)
                    return (false, "Producto no encontrado");

                var cantidadAnterior = producto.StockActual;

                // ✅ si es SALIDA, convierte cantidad a negativa
                if (tipo == "SALIDA")
                    cantidad = cantidad * -1;

                producto.StockActual += cantidad;
                producto.FechaActualizacion = DateTime.UtcNow;

                var movimiento = new MovimientoInventario
                {
                    ProductoId = productoId,
                    TipoMovimiento = tipo, // ✅ ENTRADA o SALIDA
                    Cantidad = Math.Abs(cantidad),
                    CantidadAnterior = cantidadAnterior,
                    CantidadNueva = producto.StockActual,
                    Observaciones = observaciones,
                    UsuarioId = usuarioId,
                    FechaMovimiento = DateTime.UtcNow
                };

                _context.MovimientosInventario.Add(movimiento);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Ajuste de inventario realizado exitosamente");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error: {ex.Message}");
            }
        }
        public async Task<IEnumerable<MovimientoInventario>> ObtenerMovimientosPorProducto(int productoId)
        {
            return await _context.MovimientosInventario
                .Include(m => m.Producto)
                .Where(m => m.ProductoId == productoId)
                .OrderByDescending(m => m.FechaMovimiento)
                .ToListAsync();
        }

        public async Task<object> GenerarReporteVentas(DateTime? fechaInicio, DateTime? fechaFin, string tipoReporte)
        {
            var ventas = await ObtenerVentas(fechaInicio, fechaFin);

            var reporte = new
            {
                TotalVentas = ventas.Count,
                TotalIngresos = ventas.Sum(v => v.Total),
                PromedioVenta = ventas.Any() ? ventas.Average(v => v.Total) : 0,
                VentasPorEstado = ventas.GroupBy(v => v.Estado)
                               .Select(g => new { Estado = g.Key, Cantidad = g.Count() }),
                VentasPorDia = ventas
                    .GroupBy(v => v.FechaVenta.Date)
                    .Select(g => new
                    {
                        Fecha = g.Key.ToString("yyyy-MM-dd"),
                        TotalVendido = g.Sum(v => v.Total),
                        Cantidad = g.Count()
                    })
                    .OrderBy(v => v.Fecha)

            };

            return reporte;
        }
        public async Task<object> GenerarReporteInventario()
        {
            var productos = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.Proveedor)
                .Include(p => p.UnidadMedidaBase)
                .Where(p => p.Estado)
                .ToListAsync();

            var totalProductos = productos.Count;
            var valorTotalInventario = productos.Sum(p => p.StockActual * p.PrecioCostoPromedio);
            var productosStockBajo = productos.Count(p => p.StockActual <= p.StockMinimo && p.StockActual > 0);
            var productosSinStock = productos.Count(p => p.StockActual == 0);

            var inventarioDetallado = productos.Select(p => new
            {
                p.Id,
                p.Codigo,
                Producto = p.Nombre,
                Categoria = p.Categoria != null ? p.Categoria.Nombre : "Sin categoría",
                ProveedorNombre = p.Proveedor != null ? p.Proveedor.Nombre : "Sin proveedor",
                Unidad = p.UnidadMedidaBase != null ? p.UnidadMedidaBase.Abreviatura : "N/A",
                StockActual = p.StockActual,
                StockMinimo = p.StockMinimo,
                PrecioCosto = p.PrecioCostoPromedio,
                PrecioVenta = p.PrecioVenta,
                ValorStock = p.StockActual * p.PrecioCostoPromedio,
                Estado = p.StockActual == 0
                    ? "SIN STOCK"
                    : (p.StockActual <= p.StockMinimo ? "BAJO" : "NORMAL")
            }).ToList();

            return new
            {
                TotalProductos = totalProductos,
                ValorTotalInventario = valorTotalInventario,
                ProductosStockBajo = productosStockBajo,
                ProductosSinStock = productosSinStock,
                Productos = inventarioDetallado
            };
        }


        public async Task<List<object>> ObtenerInventarioDetalladoAsync()
        {
            var productos = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .Include(p => p.Proveedor)
                .Where(p => p.Estado)
                .Select(p => new
                {
                    p.Id,
                    p.Codigo,
                    p.Nombre,
                    ProveedorId = p.ProveedorId,
                    ProveedorNombre = p.Proveedor != null ? p.Proveedor.Nombre : "Sin proveedor",
                    CategoriaNombre = p.Categoria != null ? p.Categoria.Nombre : "Sin categoría",
                    Unidad = p.UnidadMedidaBase != null ? p.UnidadMedidaBase.Abreviatura : "UND",
                    p.StockActual,
                    p.StockMinimo,
                    p.PrecioCostoPromedio,
                    p.PrecioVenta
                })
                .ToListAsync();

            return productos.Cast<object>().ToList();
        }

        public async Task<object> GenerarReporteProductosMasVendidos(DateTime? fechaInicio, DateTime? fechaFin, int top)
        {
            var ventas = await ObtenerVentas(fechaInicio, fechaFin);

            var productosMasVendidos = ventas
                .SelectMany(v => v.Detalles)
                .GroupBy(d => new { d.ProductoId, d.Producto.Nombre })
                .Select(g => new
                {
                    ProductoId = g.Key.ProductoId,
                    ProductoNombre = g.Key.Nombre,
                    CantidadVendida = g.Sum(d => d.CantidadBase),
                    TotalVendido = g.Sum(d => d.TotalLinea)
                })
                .OrderByDescending(p => p.CantidadVendida)
                .Take(top)
                .ToList();

            return productosMasVendidos;
        }

        public async Task<object> GenerarReporteMovimientosInventario(DateTime? fechaInicio, DateTime? fechaFin, string? tipoMovimiento)
        {
            // 🔹 Obtener los movimientos desde tu método existente
            var movimientos = await ObtenerMovimientosInventario(fechaInicio, fechaFin, tipoMovimiento);

            if (movimientos == null || !movimientos.Any())
            {
                return new
                {
                    TotalMovimientos = 0,
                    MovimientosPorTipo = new List<object>(),
                    MovimientosPorProducto = new List<object>(),
                    ResumenValorado = new { Entradas = 0m, Salidas = 0m, Ajustes = 0m, Total = 0m }
                };
            }

            // 🔹 Totales por tipo (incluye todos: Entrada, Salida, Ajuste, etc.)
            var movimientosPorTipo = movimientos
                .GroupBy(m => m.TipoMovimiento)
                .Select(g => new
                {
                    Tipo = g.Key,
                    Cantidad = g.Sum(x => x.Cantidad) // sumamos las cantidades reales
                })
                .OrderBy(g => g.Tipo)
                .ToList();

            // 🔹 Totales por producto (suma cantidades por producto)
            var movimientosPorProducto = movimientos
                .GroupBy(m => new { m.ProductoId, m.Producto.Nombre })
                .Select(g => new
                {
                    Producto = g.Key.Nombre,
                    Cantidad = g.Sum(x => x.Cantidad)
                })
                .OrderBy(g => g.Producto)
                .ToList();

            // 🔹 Resumen valorado (usando PrecioCompra si existe)
            var resumenValorado = new
            {
                Entradas = movimientos
           .Where(m => m.TipoMovimiento == "ENTRADA")
           .Sum(m => m.Cantidad * (m.Producto?.PrecioCostoPromedio ?? 0)),

                Salidas = movimientos
           .Where(m => m.TipoMovimiento == "SALIDA")
           .Sum(m => m.Cantidad * (m.Producto?.PrecioCostoPromedio ?? 0)),

                Ajustes = movimientos
           .Where(m => m.TipoMovimiento == "AJUSTE")
           .Sum(m => m.Cantidad * (m.Producto?.PrecioCostoPromedio ?? 0)),

                Total = movimientos.Sum(m => m.Cantidad * (m.Producto?.PrecioCostoPromedio ?? 0))
            };

            // 🔹 Respuesta para el frontend
            var reporte = new
            {
                TotalMovimientos = movimientos.Count(),
                MovimientosPorTipo = movimientosPorTipo,
                MovimientosPorProducto = movimientosPorProducto,
                ResumenValorado = resumenValorado
            };

            return reporte;
        }

        public async Task<object> GenerarReporteCompras(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var compras = await ObtenerCompras(fechaInicio, fechaFin, null);

            var comprasConTotales = compras.Select(c => new
            {
                proveedor = c.Proveedor?.Nombre ?? "Sin proveedor",
                total = (c.Total > 0 ? c.Total :
                        (c.Detalles?.Sum(d => (d.TotalLinea > 0 ? d.TotalLinea : d.Cantidad * d.PrecioUnitario)) ?? 0m)
                        + c.Impuestos)
            }).ToList();

            var reporte = new
            {
                totalCompras = comprasConTotales.Count,
                totalInvertido = comprasConTotales.Sum(c => c.total),
                comprasPorProveedor = comprasConTotales
                    .GroupBy(c => c.proveedor)
                    .Select(g => new
                    {
                        proveedor = g.Key,
                        cantidad = g.Count(),
                        totalInvertido = g.Sum(c => c.total),
                        promedioPorCompra = g.Count() > 0 ? g.Sum(c => c.total) / g.Count() : 0
                    })
                    .OrderByDescending(g => g.totalInvertido)
                    .ToList()
            };

            return reporte;
        }


        public async Task<object> ObtenerEstadisticasVentas(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var ventas = await ObtenerVentas(fechaInicio, fechaFin);
            var hoy = DateTime.Today;

            return new
            {
                VentasHoy = ventas.Count(v => v.FechaVenta.Date == hoy),
                IngresosHoy = ventas.Where(v => v.FechaVenta.Date == hoy).Sum(v => v.Total),
                VentasMes = ventas.Count(v => v.FechaVenta.Month == hoy.Month && v.FechaVenta.Year == hoy.Year),
                IngresosMes = ventas.Where(v => v.FechaVenta.Month == hoy.Month && v.FechaVenta.Year == hoy.Year).Sum(v => v.Total)
            };
        }

        // Métodos para PDF 
        public async Task<byte[]> GenerarFacturaPdf(int ventaId)
        {
            return await _pdfService.GenerarFacturaVenta(ventaId);
        }

        public async Task<byte[]> GenerarReporteVentasPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            return await _pdfService.GenerarReporteVentas(fechaInicio, fechaFin);
        }

        public async Task<byte[]> GenerarReporteComprasPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            return await _pdfService.GenerarReporteComprasPdf(fechaInicio, fechaFin);
        }

        public async Task<byte[]> GenerarReporteInventarioPdf()
        {
            return await _pdfService.GenerarReporteInventarioPdf();
        }

        public async Task<byte[]> GenerarReporteMovimientosInventarioPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            return await _pdfService.GenerarReporteMovimientosInventarioPdf(fechaInicio, fechaFin);
        }
    }
}