using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public ReportesController(ProductoService productoService)
        {
            _productoService = productoService;
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
    }
}