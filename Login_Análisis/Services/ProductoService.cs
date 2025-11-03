using Login_Análisis.Data;
using Login_Análisis.Models;
using Microsoft.EntityFrameworkCore;

namespace Login_Análisis.Services
{
    public class ProductoService
    {
        private readonly ApplicationDbContext _context;

        public ProductoService(ApplicationDbContext context)
        {
            _context = context;
        }
        public ApplicationDbContext Context => _context;

        // Métodos para Proveedores
        public async Task<List<Proveedor>> ObtenerProveedores()
        {
            return await _context.Proveedores
                .Where(p => p.Estado)
                .OrderBy(p => p.Nombre)
                .ToListAsync();
        }

        public async Task<Proveedor> ObtenerProveedor(int id)
        {
            return await _context.Proveedores.FindAsync(id);
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

        // Métodos para Productos
        public async Task<List<Producto>> ObtenerProductos()
        {
            return await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.UnidadMedidaBase)
                .Where(p => p.Estado)
                .OrderBy(p => p.Nombre)
                .ToListAsync();
        }

        public async Task<Producto> ObtenerProducto(int id)
        {
            return await _context.Productos
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

        // Métodos para Compras
        public async Task<(bool success, string message, Compra compra)> CrearCompra(Compra compra, List<DetalleCompra> detalles)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Verificar si ya existe una compra con el mismo número de factura
                if (await _context.Compras.AnyAsync(c => c.NumeroFactura == compra.NumeroFactura))
                {
                    return (false, "Ya existe una compra con este número de factura", null);
                }

                // Calcular totales
                compra.Subtotal = detalles.Sum(d => d.TotalLinea);
                compra.Total = compra.Subtotal + compra.Impuestos;

                // Guardar compra
                _context.Compras.Add(compra);
                await _context.SaveChangesAsync();

                // Procesar cada detalle
                foreach (var detalle in detalles)
                {
                    detalle.CompraId = compra.Id;

                    // Obtener producto y unidad de medida
                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    var unidadMedida = await _context.UnidadesMedida.FindAsync(detalle.UnidadMedidaId);

                    if (producto == null || unidadMedida == null)
                    {
                        throw new Exception("Producto o unidad de medida no encontrado");
                    }

                    // Convertir cantidad a unidad base
                    detalle.CantidadBase = detalle.Cantidad * unidadMedida.FactorConversion;

                    // Guardar detalle
                    _context.DetalleCompras.Add(detalle);

                    // Actualizar inventario y precios del producto
                    await ActualizarInventarioProducto(producto, detalle);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, "Compra registrada exitosamente", compra);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return (false, $"Error: {ex.Message}", null);
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

        public async Task<List<Compra>> ObtenerCompras(DateTime? fechaInicio = null, DateTime? fechaFin = null)
        {
            var query = _context.Compras
                .Include(c => c.Proveedor)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .AsQueryable();

            if (fechaInicio.HasValue)
            {
                query = query.Where(c => c.FechaCompra >= fechaInicio.Value);
            }

            if (fechaFin.HasValue)
            {
                query = query.Where(c => c.FechaCompra <= fechaFin.Value);
            }

            return await query.OrderByDescending(c => c.FechaCompra).ToListAsync();
        }

        // Método para conversión de unidades en ventas
        public async Task<decimal> ConvertirUnidad(int desdeUnidadId, int aUnidadId, decimal cantidad)
        {
            var unidadDesde = await _context.UnidadesMedida.FindAsync(desdeUnidadId);
            var unidadHacia = await _context.UnidadesMedida.FindAsync(aUnidadId);

            if (unidadDesde == null || unidadHacia == null)
            {
                throw new Exception("Unidades de medida no encontradas");
            }

            // Convertir a unidad base primero, luego a la unidad destino
            var cantidadBase = cantidad * unidadDesde.FactorConversion;
            return cantidadBase / unidadHacia.FactorConversion;
        }

        // Métodos para Ventas
        public async Task<(bool success, string message, Venta venta)> CrearVenta(Venta venta, List<DetalleVenta> detalles)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Verificar si ya existe una venta con el mismo número de factura
                if (await _context.Ventas.AnyAsync(c => c.NumeroFactura == venta.NumeroFactura))
                {
                    return (false, "Ya existe una venta con este número de factura", null);
                }

                // Calcular totales
                venta.Subtotal = detalles.Sum(d => d.TotalLinea);
                venta.Total = venta.Subtotal + venta.Impuestos;

                // Guardar venta
                _context.Ventas.Add(venta);
                await _context.SaveChangesAsync();

                // Procesar cada detalle
                foreach (var detalle in detalles)
                {
                    detalle.VentaId = venta.Id;

                    // Obtener producto y unidad de medida
                    var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                    var unidadMedida = await _context.UnidadesMedida.FindAsync(detalle.UnidadMedidaId);

                    if (producto == null || unidadMedida == null)
                    {
                        throw new Exception("Producto o unidad de medida no encontrado");
                    }

                    // Convertir cantidad a unidad base
                    detalle.CantidadBase = detalle.Cantidad * unidadMedida.FactorConversion;

                    // Guardar detalle
                    _context.DetalleVentas.Add(detalle);

                    // Actualizar inventario del producto (reducir stock)
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

        public async Task<List<Venta>> ObtenerVentas(DateTime? fechaInicio = null, DateTime? fechaFin = null)
        {
            var query = _context.Ventas
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.Producto)
                .Include(c => c.Detalles)
                    .ThenInclude(d => d.UnidadMedida)
                .AsQueryable();

            if (fechaInicio.HasValue)
            {
                query = query.Where(c => c.FechaVenta >= fechaInicio.Value);
            }

            if (fechaFin.HasValue)
            {
                query = query.Where(c => c.FechaVenta <= fechaFin.Value);
            }

            return await query.OrderByDescending(c => c.FechaVenta).ToListAsync();
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

        // Método para obtener unidad de medida por ID
        public async Task<UnidadMedida> ObtenerUnidadMedida(int id)
        {
            return await _context.UnidadesMedida.FindAsync(id);
        }
    }
}