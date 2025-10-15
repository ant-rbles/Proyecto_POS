using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using Login_Análisis.DTOs;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos de la venta inválidos" });
            }

            var venta = new Venta
            {
                NumeroFactura = request.NumeroFactura,
                FechaVenta = request.FechaVenta,
                Impuestos = request.Impuestos,
                Observaciones = request.Observaciones,
                ClienteId = request.ClienteId,
                NombreCliente = request.NombreCliente,
                UsuarioCreacion = request.UsuarioCreacion,
                FechaCreacion = DateTime.UtcNow
            };

            var detalles = request.Detalles.Select(d => new DetalleVenta
            {
                ProductoId = d.ProductoId,
                UnidadMedidaId = d.UnidadMedidaId,
                Cantidad = d.Cantidad,
                PrecioUnitario = d.PrecioUnitario,
                TotalLinea = d.Cantidad * d.PrecioUnitario
            }).ToList();

            var result = await _productoService.CrearVenta(venta, detalles);
            if (!result.success)
                return BadRequest(new { Message = result.message });

            return Ok(new { Message = result.message, Venta = result.venta });
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerVentas([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
        {
            var ventas = await _productoService.ObtenerVentas(fechaInicio, fechaFin);
            return Ok(ventas);
        }
    }
}