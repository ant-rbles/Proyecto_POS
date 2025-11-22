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
    [AuthorizeRole(Roles.Administrador, Roles.Cajero, Roles.Vendedor)]
    public class MembresiasController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public MembresiasController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        // Crear - Recepcionista (Cajero), Vendedor y Admin pueden crear
        [HttpPost]
        [AuthorizeRole(Roles.Cajero, Roles.Vendedor, Roles.Administrador)]
        public async Task<IActionResult> Crear([FromBody] MembresiaRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Message = "Datos inválidos", Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                var result = await _productoService.CrearMembresia(request, usuarioId);
                if (!result.success) return BadRequest(new { Message = result.message });
                return Ok(new { Message = result.message, Membresia = result.membresia });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        // Listar - Todos los roles permitidos
        [HttpGet]
        [AuthorizeRole(Roles.Cajero, Roles.Vendedor, Roles.Administrador)]
        public async Task<IActionResult> ObtenerTodos()
        {
            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                var lista = await _productoService.ObtenerMembresiasPorUsuario(usuarioId);
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Obtener(int id)
        {
            try
            {
                var m = await _productoService.ObtenerMembresia(id);
                if (m == null) return NotFound(new { Message = "Membresía no encontrada" });
                return Ok(m);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        // Modificar - Supervisor (Vendedor) y Admin pueden modificar, pero no sobre canceladas
        [HttpPut("{id}")]
        [AuthorizeRole(Roles.Vendedor, Roles.Administrador)]
        public async Task<IActionResult> Modificar(int id, [FromBody] MembresiaRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Message = "Datos inválidos", Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });

            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                var result = await _productoService.ModificarMembresia(id, request, usuarioId);
                if (!result.success) return BadRequest(new { Message = result.message });
                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }

        // Cambiar estado - Cancelar/Reactivate: Solo Administrador
        [HttpPut("{id}/estado")]
        [AuthorizeRole(Roles.Administrador)]
        public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambioEstadoRequest request)
        {
            try
            {
                var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                var result = await _productoService.CambiarEstadoMembresia(id, request.Estado, usuarioId);
                if (!result.success) return BadRequest(new { Message = result.message });
                return Ok(new { Message = result.message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno: {ex.Message}" });
            }
        }
    }

    public class CambioEstadoRequest
    {
        public string Estado { get; set; }
    }
}
