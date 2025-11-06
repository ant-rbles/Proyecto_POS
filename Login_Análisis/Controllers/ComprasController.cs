using Login_Análisis.DTOs;
using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComprasController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public ComprasController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpPost]
        public async Task<IActionResult> CrearCompra([FromBody] CompraRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    Message = "Datos de la compra inválidos",
                    Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            try
            {
                // Generar número de factura automático si no se proporciona
                if (string.IsNullOrEmpty(request.NumeroFactura))
                {
                    request.NumeroFactura = await GenerarNumeroFactura();
                }

                // Verificar si ya existe una compra con el mismo número de factura
                var compraExistente = await _productoService.ObtenerCompraPorNumeroFactura(request.NumeroFactura);
                if (compraExistente != null)
                {
                    return BadRequest(new { Message = "Ya existe una compra con este número de factura" });
                }

                var compra = new Compra
                {
                    NumeroFactura = request.NumeroFactura,
                    ProveedorId = request.ProveedorId,
                    FechaCompra = request.FechaCompra,
                    FechaRecepcion = DateTime.UtcNow,
                    Impuestos = request.Impuestos,
                    Observaciones = request.Observaciones,
                    UsuarioCreacion = request.UsuarioCreacion,
                    FechaCreacion = DateTime.UtcNow,
                    Estado = "COMPLETADA"
                };

                // Convertir DetalleCompraRequest a DetalleCompra (MODELO)
                var detalles = request.Detalles.Select(d => new DetalleCompra
                {
                    ProductoId = d.ProductoId,
                    UnidadMedidaId = d.UnidadMedidaId,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    TotalLinea = d.Cantidad * d.PrecioUnitario
                }).ToList();

                var result = await _productoService.CrearCompra(compra, detalles);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message, Compra = result.compra });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno del servidor: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerCompras(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin,
            [FromQuery] string? estado = null)
        {
            try
            {
                var compras = await _productoService.ObtenerCompras(fechaInicio, fechaFin, estado);
                return Ok(compras);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno del servidor: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerCompra(int id)
        {
            try
            {
                var compra = await _productoService.ObtenerCompra(id);
                if (compra == null)
                    return NotFound(new { Message = "Compra no encontrada" });

                return Ok(compra);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno del servidor: {ex.Message}" });
            }
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoCompra(int id, [FromBody] CambiarEstadoCompraRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Estado inválido" });
            }

            try
            {
                var result = await _productoService.CambiarEstadoCompra(id, request.Estado);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno del servidor: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> AnularCompra(int id)
        {
            try
            {
                var result = await _productoService.AnularCompra(id);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno del servidor: {ex.Message}" });
            }
        }

        private async Task<string> GenerarNumeroFactura()
        {
            var ultimaCompra = await _productoService.ObtenerUltimaCompra();
            var numero = 1;

            if (ultimaCompra != null && !string.IsNullOrEmpty(ultimaCompra.NumeroFactura))
            {
                // Buscar el último número en facturas que empiecen con "FAC-"
                if (ultimaCompra.NumeroFactura.StartsWith("FAC-"))
                {
                    var partes = ultimaCompra.NumeroFactura.Split('-');
                    if (partes.Length > 1 && int.TryParse(partes[1], out int ultimoNumero))
                    {
                        numero = ultimoNumero + 1;
                    }
                }
            }

            return $"FAC-{numero:00000}";
        }
    }

    public class CambiarEstadoCompraRequest
    {
        [Required]
        public string Estado { get; set; }
    }
}