using Login_Análisis.Constants;
using Login_Análisis.DTOs;
using Login_Análisis.Filters;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AuthorizeRole(Roles.Vendedor)]
    public class PresupuestosController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public PresupuestosController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpPost]
        public async Task<IActionResult> CrearPresupuesto([FromBody] PresupuestoRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    Message = "Datos del presupuesto inválidos",
                    Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var result = await _productoService.CrearPresupuesto(request, usuarioId);

                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new
                {
                    Message = result.message,
                    Presupuesto = result.presupuesto,
                    PresupuestoId = result.presupuesto.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerPresupuestos()
        {
            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var presupuestos = await _productoService.ObtenerPresupuestosPorVendedor(usuarioId);
                return Ok(presupuestos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPresupuesto(int id)
        {
            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var presupuesto = await _productoService.ObtenerPresupuesto(id, usuarioId);

                if (presupuesto == null)
                    return NotFound(new { Message = "Presupuesto no encontrado" });

                return Ok(presupuesto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoPresupuesto(int id, [FromBody] CambiarEstadoPresupuestoRequest request)
        {
            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var result = await _productoService.CambiarEstadoPresupuesto(id, request.Estado, usuarioId);

                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DescargarPresupuestoPdf(int id)
        {
            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var pdfBytes = await _productoService.GenerarPresupuestoPdf(id, usuarioId);

                if (pdfBytes == null)
                    return NotFound(new { Message = "Presupuesto no encontrado" });

                return File(pdfBytes, "application/pdf", $"Presupuesto_{id}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error al generar PDF: {ex.Message}" });
            }
        }

        [HttpPost("{id}/convertir-venta")]
        [AuthorizeRole(Roles.Administrador, Roles.Cajero)]
        public async Task<IActionResult> ConvertirEnVenta(int id)
        {
            try
            {
                var result = await _productoService.ConvertirPresupuestoEnVenta(id);

                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new
                {
                    Message = result.message,
                    VentaId = result.ventaId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }
    }

    public class CambiarEstadoPresupuestoRequest
    {
        public string Estado { get; set; }
    }
}