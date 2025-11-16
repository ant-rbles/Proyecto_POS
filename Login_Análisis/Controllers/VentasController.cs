using Login_Análisis.Constants;
using Login_Análisis.DTOs;
using Login_Análisis.Filters;
using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AuthorizeRole(Roles.Administrador, Roles.Cajero)]
    public class VentasController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public VentasController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpPost]
        public async Task<IActionResult> CrearVenta([FromBody] VentaRequest request)
        {
            try
            {
                // 🧩 VALIDACIÓN DE MODELO
                if (!ModelState.IsValid)
                {
                    var errores = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    Console.WriteLine("❌ Error de validación en VentaRequest:");
                    foreach (var e in errores)
                        Console.WriteLine($" - {e}");

                    return BadRequest(new
                    {
                        Message = "Datos de la venta inválidos",
                        Errors = errores
                    });
                }

                // 🧮 VALIDAR STOCK ANTES DE CREAR VENTA
                foreach (var detalle in request.Detalles)
                {
                    var producto = await _productoService.ObtenerProducto(detalle.ProductoId);

                    if (producto == null)
                    {
                        Console.WriteLine($"⚠️ Producto con ID {detalle.ProductoId} no encontrado en la base de datos.");
                        return BadRequest(new
                        {
                            Message = $"El producto con ID {detalle.ProductoId} no existe."
                        });
                    }

                    if (producto.StockActual < detalle.Cantidad)
                    {
                        Console.WriteLine($"⚠️ Stock insuficiente para el producto {producto.Nombre}. Stock actual: {producto.StockActual}, solicitado: {detalle.Cantidad}");
                        return BadRequest(new
                        {
                            Message = $"Stock insuficiente para el producto {producto.Nombre}"
                        });
                    }
                }

                // ✅ LLAMAR A LA LÓGICA DE CREACIÓN
                var result = await _productoService.CrearVenta(request);

                if (!result.success)
                {
                    Console.WriteLine($"⚠️ Fallo en la creación de la venta: {result.message}");
                    return BadRequest(new { Message = result.message });
                }

                Console.WriteLine($"✅ Venta creada correctamente con ID {result.venta.Id}");

                return Ok(new
                {
                    Message = result.message,
                    Venta = result.venta,
                    VentaId = result.venta.Id
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("🔥 Error en CrearVenta:");
                Console.WriteLine($"Mensaje: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");

                return BadRequest(new
                {
                    Message = "Error al crear la venta",
                    Error = ex.Message,
                    StackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerVentas(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null,
            [FromQuery] string? estado = null)
        {
            try
            {
                // Valores por defecto si no vienen del frontend
                fechaInicio ??= DateTime.Today.AddMonths(-1);
                fechaFin ??= DateTime.Today.AddDays(1);

                var ventas = await _productoService.ObtenerVentas(fechaInicio, fechaFin, estado);

                if (ventas == null || !ventas.Any())
                    return Ok(new List<object>()); // devuelve lista vacía para evitar 500

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Error al obtener ventas", Error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerVenta(int id)
        {
            var venta = await _productoService.ObtenerVenta(id);
            if (venta == null)
                return NotFound(new { Message = "Venta no encontrada" });

            return Ok(venta);
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoVenta(int id, [FromBody] CambiarEstadoVentaRequest request)
        {
            try
            {
                var result = await _productoService.CambiarEstadoVenta(id, request.Estado);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DescargarFacturaPdf(int id)
        {
            try
            {
                var pdfBytes = await _productoService.GenerarFacturaPdf(id);
                if (pdfBytes == null)
                    return NotFound(new { Message = "Venta no encontrada" });

                return File(pdfBytes, "application/pdf", $"factura_{id}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error al generar PDF: {ex.Message}" });
            }
        }

        // Método para obtener estadísticas de ventas

        [HttpGet("estadisticas")]
        public async Task<IActionResult> ObtenerEstadisticasVentas(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                // Valores por defecto si no se mandan parámetros
                fechaInicio ??= DateTime.Today.AddMonths(-1);
                fechaFin ??= DateTime.Today.AddDays(1);

                var estadisticas = await _productoService.ObtenerEstadisticasVentas(fechaInicio, fechaFin);

                if (estadisticas == null)
                    return Ok(new { ventasHoy = 0, ingresosHoy = 0, ventasMes = 0, ingresosMes = 0 });

                return Ok(estadisticas);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error al obtener estadísticas: {ex.Message}" });
            }
        }
    }

    public class CambiarEstadoVentaRequest
    {
        [Required]
        public string Estado { get; set; }
    }
}