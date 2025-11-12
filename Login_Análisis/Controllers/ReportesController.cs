using Login_Análisis.Data;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly ProductoService _productoService;
        private readonly ApplicationDbContext _context;

        public ReportesController(ProductoService productoService, ApplicationDbContext context)
        {
            _productoService = productoService;
            _context = context;
        }

        [HttpGet("ventas")]
        public async Task<IActionResult> ReporteVentas(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin,
            [FromQuery] string? tipoReporte = "diario")
        {
            try
            {
                var reporte = await _productoService.GenerarReporteVentas(fechaInicio, fechaFin, tipoReporte);
                return Ok(reporte);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("inventario")]
        public async Task<IActionResult> ReporteInventario()
        {
            try
            {
                var reporte = await _productoService.GenerarReporteInventario();
                return Ok(reporte);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("inventario/detallado")]
        public async Task<IActionResult> ReporteInventarioDetallado()
        {
            try
            {
                var productos = await _context.Productos
                    .Include(p => p.Categoria)
                    .Include(p => p.UnidadMedidaBase)
                    .Include(p => p.Proveedor)
                    .Where(p => p.Estado)
                    .Select(p => new
                    {
                        p.Id,
                        codigo = p.Codigo,
                        nombre = p.Nombre,
                        descripcion = p.Descripcion,
                        proveedorId = p.ProveedorId,
                        proveedorNombre = p.Proveedor != null ? p.Proveedor.Nombre : "Sin proveedor",
                        categoriaNombre = p.Categoria != null ? p.Categoria.Nombre : "Sin categoría",
                        unidad = p.UnidadMedidaBase != null ? p.UnidadMedidaBase.Abreviatura : "N/A",
                        stockActual = p.StockActual,
                        stockMinimo = p.StockMinimo,
                        precioCostoPromedio = p.PrecioCostoPromedio,
                        precioVenta = p.PrecioVenta
                    })
                    .ToListAsync();

                var totalProductos = productos.Count;
                var valorTotalInventario = productos.Sum(p => p.precioCostoPromedio * p.stockActual);
                var productosStockBajo = productos.Count(p => p.stockActual <= p.stockMinimo && p.stockActual > 0);
                var productosSinStock = productos.Count(p => p.stockActual == 0);

                return Ok(new
                {
                    totalProductos,
                    valorTotalInventario,
                    productosStockBajo,
                    productosSinStock,
                    productos
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }


        [HttpGet("productos-mas-vendidos")]
        public async Task<IActionResult> ReporteProductosMasVendidos(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin,
            [FromQuery] int top = 10)
        {
            try
            {
                var reporte = await _productoService.GenerarReporteProductosMasVendidos(fechaInicio, fechaFin, top);
                return Ok(reporte);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("movimientos-inventario")]
        public async Task<IActionResult> ReporteMovimientosInventario(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin,
            [FromQuery] string? tipoMovimiento = null)
        {
            try
            {
                var reporte = await _productoService.GenerarReporteMovimientosInventario(fechaInicio, fechaFin, tipoMovimiento);
                return Ok(reporte);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("compras")]
        public async Task<IActionResult> ReporteCompras(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin)
        {
            try
            {
                var reporte = await _productoService.GenerarReporteCompras(fechaInicio, fechaFin);
                return Ok(reporte);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("pdf/ventas")]
        public async Task<IActionResult> DescargarReporteVentasPdf(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin)
        {
            try
            {
                var pdfBytes = await _productoService.GenerarReporteVentasPdf(fechaInicio, fechaFin);
                return File(pdfBytes, "application/pdf", $"reporte_ventas_{DateTime.Now:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error al generar PDF: {ex.Message}" });
            }
        }

        [HttpGet("pdf/inventario")]
        public async Task<IActionResult> DescargarReporteInventarioPdf()
        {
            try
            {
                var pdfBytes = await _productoService.GenerarReporteInventarioPdf();
                return File(pdfBytes, "application/pdf", $"reporte_inventario_{DateTime.Now:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error al generar PDF de inventario: {ex.Message}" });
            }
        }
    }
}