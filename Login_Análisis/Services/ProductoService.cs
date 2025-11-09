using Login_Análisis.Data;
using Login_Análisis.DTOs;
using Login_Análisis.Models;
using Microsoft.EntityFrameworkCore;

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

                    // Actualizar inventario
                    var stockAnterior = producto.StockActual;
                    producto.StockActual += detalle.Cantidad;

                    // Recalcular costo promedio (promedio ponderado)
                    var valorInventarioAnterior = stockAnterior * producto.PrecioCostoPromedio;
                    var valorNuevaCompra = detalle.Cantidad * detalle.PrecioUnitario;

                    producto.PrecioCostoPromedio = (valorInventarioAnterior + valorNuevaCompra) / producto.StockActual;

                    // Recalcular precio de venta según margen
                    producto.PrecioVenta = producto.PrecioCostoPromedio * (1 + (producto.MargenGanancia / 100m));

                    producto.FechaActualizacion = DateTime.UtcNow;
                }

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
                // Generar número de factura automático
                var numeroFactura = GenerarNumeroFactura();

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
                    FechaCreacion = DateTime.UtcNow,
                    Estado = "COMPLETADA"
                };

                // Calcular totales
                decimal subtotal = 0;
                var detalles = new List<DetalleVenta>();

                foreach (var detalleRequest in request.Detalles)
                {
                    var producto = await _context.Productos.FindAsync(detalleRequest.ProductoId);
                    var unidadMedida = await _context.UnidadesMedida.FindAsync(detalleRequest.UnidadMedidaId);

                    if (producto == null || unidadMedida == null)
                        throw new Exception("Producto o unidad de medida no encontrado");

                    // Convertir cantidad a unidad base
                    var cantidadBase = detalleRequest.Cantidad * unidadMedida.FactorConversion;

                    // Usar precio de venta del producto (no editable)
                    var precioUnitario = producto.PrecioVenta;

                    // Aplicar descuento si existe
                    var precioConDescuento = precioUnitario * (1 - detalleRequest.DescuentoAplicado / 100);
                    var totalLinea = detalleRequest.Cantidad * precioConDescuento;
                    subtotal += totalLinea;

                    var detalle = new DetalleVenta
                    {
                        ProductoId = detalleRequest.ProductoId,
                        UnidadMedidaId = detalleRequest.UnidadMedidaId,
                        Cantidad = detalleRequest.Cantidad,
                        CantidadBase = cantidadBase,
                        PrecioUnitario = precioConDescuento,
                        DescuentoAplicado = detalleRequest.DescuentoAplicado,
                        TotalLinea = totalLinea
                    };

                    detalles.Add(detalle);
                }

                // Aplicar descuento global y calcular impuestos
                venta.Subtotal = subtotal - request.DescuentoGlobal;
                venta.Impuestos = request.AplicarIVA ? venta.Subtotal * 0.12m : 0; // 12% IVA Guatemala
                venta.Total = venta.Subtotal + venta.Impuestos;

                // Guardar venta
                _context.Ventas.Add(venta);
                await _context.SaveChangesAsync();

                // Guardar detalles y actualizar inventario
                foreach (var detalle in detalles)
                {
                    detalle.VentaId = venta.Id;
                    _context.DetalleVentas.Add(detalle);

                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    await ActualizarInventarioVenta(producto, detalle);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Venta registrada exitosamente", venta);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error: {ex.Message}", null);
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
            var query = _context.Ventas
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .Include(v => v.Cliente) 
                .AsQueryable();

            if (fechaInicio.HasValue)
            {
                query = query.Where(v => v.FechaVenta >= fechaInicio.Value);
            }

            if (fechaFin.HasValue)
            {
                query = query.Where(v => v.FechaVenta <= fechaFin.Value);
            }

            if (!string.IsNullOrEmpty(estado))
            {
                query = query.Where(v => v.Estado == estado);
            }

            return await query.OrderByDescending(v => v.FechaVenta).ToListAsync();
        }

        public async Task<(bool success, string message)> CambiarEstadoVenta(int ventaId, string estado)
        {
            try
            {
                var venta = await _context.Ventas.FindAsync(ventaId);
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

        public async Task<Venta> ObtenerVenta(int id)
        {
            return await _context.Ventas
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(v => v.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .Include(v => v.Cliente) 
                .FirstOrDefaultAsync(v => v.Id == id);
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
            var ultimaVenta = _context.Ventas
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


        // Métodos para Movimientos de Inventario
        public async Task<List<MovimientoInventario>> ObtenerMovimientosInventario(
            DateTime? fechaInicio = null,
            DateTime? fechaFin = null,
            string? tipoMovimiento = null,
            int? productoId = null)
        {
            var query = _context.MovimientosInventario
                .Include(m => m.Producto)
                .AsQueryable();

            if (fechaInicio.HasValue)
            {
                query = query.Where(m => m.FechaMovimiento >= fechaInicio.Value);
            }

            if (fechaFin.HasValue)
            {
                query = query.Where(m => m.FechaMovimiento <= fechaFin.Value);
            }

            if (!string.IsNullOrEmpty(tipoMovimiento))
            {
                query = query.Where(m => m.TipoMovimiento == tipoMovimiento);
            }

            if (productoId.HasValue)
            {
                query = query.Where(m => m.ProductoId == productoId.Value);
            }

            return await query.OrderByDescending(m => m.FechaMovimiento).ToListAsync();
        }

        public async Task<List<MovimientoInventario>> ObtenerMovimientosPorProducto(int productoId)
        {
            return await _context.MovimientosInventario
                .Include(m => m.Producto)
                .Where(m => m.ProductoId == productoId)
                .OrderByDescending(m => m.FechaMovimiento)
                .ToListAsync();
        }

        public async Task<(bool success, string message)> CrearAjusteInventario(
            int productoId,
            decimal cantidad,
            string observaciones,
            int? usuarioId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var producto = await _context.Productos.FindAsync(productoId);
                if (producto == null)
                    return (false, "Producto no encontrado");

                var cantidadAnterior = producto.StockActual;
                producto.StockActual += cantidad;
                producto.FechaActualizacion = DateTime.UtcNow;

                var movimiento = new MovimientoInventario
                {
                    ProductoId = productoId,
                    TipoMovimiento = cantidad > 0 ? "AJUSTE_POSITIVO" : "AJUSTE_NEGATIVO",
                    Cantidad = Math.Abs(cantidad),
                    CantidadAnterior = cantidadAnterior,
                    CantidadNueva = producto.StockActual,
                    PrecioCosto = producto.PrecioCostoPromedio,
                    PrecioVenta = producto.PrecioVenta,
                    ReferenciaTipo = "AJUSTE_MANUAL",
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

        // Métodos para Reportes (JSON para pantalla)
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
                VentasPorDia = ventas.GroupBy(v => v.FechaVenta.Date)
                            .Select(g => new { Fecha = g.Key, Total = g.Sum(v => v.Total), Cantidad = g.Count() })
            };

            return reporte;
        }

        public async Task<object> GenerarReporteInventario()
        {
            var productos = await ObtenerTodosProductosAsync();

            var reporte = new
            {
                TotalProductos = productos.Count,
                ValorTotalInventario = productos.Sum(p => p.StockActual * p.PrecioCostoPromedio),
                ProductosStockBajo = productos.Count(p => p.StockActual <= p.StockMinimo && p.StockActual > 0),
                ProductosStockCritico = productos.Count(p => p.StockActual == 0),
                ProductosPorCategoria = productos.GroupBy(p => p.Categoria?.Nombre ?? "Sin Categoría")
                                       .Select(g => new { Categoria = g.Key, Cantidad = g.Count() })
            };

            return reporte;
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
            var movimientos = await ObtenerMovimientosInventario(fechaInicio, fechaFin, tipoMovimiento);

            var reporte = new
            {
                TotalMovimientos = movimientos.Count,
                MovimientosPorTipo = movimientos.GroupBy(m => m.TipoMovimiento)
                                      .Select(g => new { Tipo = g.Key, Cantidad = g.Count() }),
                MovimientosPorProducto = movimientos.GroupBy(m => new { m.ProductoId, m.Producto.Nombre })
                                          .Select(g => new { Producto = g.Key.Nombre, Cantidad = g.Count() })
            };

            return reporte;
        }

        public async Task<object> GenerarReporteCompras(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var compras = await ObtenerCompras(fechaInicio, fechaFin);

            var reporte = new
            {
                TotalCompras = compras.Count,
                TotalInvertido = compras.Sum(c => c.Total),
                ComprasPorProveedor = compras.GroupBy(c => c.Proveedor.Nombre)
                                   .Select(g => new { Proveedor = g.Key, Total = g.Sum(c => c.Total), Cantidad = g.Count() })
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

        public async Task<byte[]> GenerarReporteInventarioPdf()
        {
            return await _pdfService.GenerarReporteInventario();
        }

        public async Task<byte[]> GenerarReporteComprasPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            return await _pdfService.GenerarReporteCompras(fechaInicio, fechaFin);
        }
    }
}