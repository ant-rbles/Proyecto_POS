using Login_Análisis.DTOs;
using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public ProveedoresController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Proveedor>>> GetProveedores()
        {
            var proveedores = await _productoService.ObtenerProveedoresActivosAsync();
            return Ok(proveedores);
        }

        [HttpGet("todos")]
        public async Task<ActionResult<IEnumerable<Proveedor>>> GetTodosProveedores()
        {
            try
            {
                var proveedores = await _productoService.ObtenerTodosProveedoresAsync();
                return Ok(proveedores);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerProveedor(int id)
        {
            try
            {
                var proveedor = await _productoService.ObtenerProveedor(id);
                if (proveedor == null)
                    return NotFound(new { Message = "Proveedor no encontrado" });

                var proveedorResponse = new ProveedorResponse
                {
                    Id = proveedor.Id,
                    Nombre = proveedor.Nombre,
                    RUC = proveedor.RUC,
                    Direccion = proveedor.Direccion,
                    Telefono = proveedor.Telefono,
                    Email = proveedor.Email,
                    Contacto = proveedor.Contacto,
                    Estado = proveedor.Estado,
                    FechaCreacion = proveedor.FechaCreacion,
                    FechaActualizacion = proveedor.FechaActualizacion
                };

                return Ok(proveedorResponse);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearProveedor([FromBody] ProveedorRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del proveedor inválidos" });
            }

            try
            {
                if (!string.IsNullOrEmpty(request.RUC))
                {
                    var proveedorExistente = await _productoService.ObtenerProveedorPorRUC(request.RUC);
                    if (proveedorExistente != null)
                    {
                        return BadRequest(new { Message = "Ya existe un proveedor con este RUC" });
                    }
                }

                var proveedor = new Proveedor
                {
                    Nombre = request.Nombre,
                    RUC = request.RUC,
                    Direccion = request.Direccion,
                    Telefono = request.Telefono,
                    Email = request.Email,
                    Contacto = request.Contacto,
                    Estado = true,
                    FechaCreacion = DateTime.UtcNow
                };

                var result = await _productoService.CrearProveedor(proveedor);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                // Crear response
                var proveedorResponse = new ProveedorResponse
                {
                    Id = proveedor.Id,
                    Nombre = proveedor.Nombre,
                    RUC = proveedor.RUC,
                    Direccion = proveedor.Direccion,
                    Telefono = proveedor.Telefono,
                    Email = proveedor.Email,
                    Contacto = proveedor.Contacto,
                    Estado = proveedor.Estado,
                    FechaCreacion = proveedor.FechaCreacion,
                    FechaActualizacion = proveedor.FechaActualizacion
                };

                return Ok(new { Message = result.message, Proveedor = proveedorResponse });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProveedor(int id, [FromBody] ProveedorRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del proveedor inválidos" });
            }

            try
            {
                var proveedorExistente = await _productoService.ObtenerProveedor(id);
                if (proveedorExistente == null)
                    return NotFound(new { Message = "Proveedor no encontrado" });

                if (!string.IsNullOrEmpty(request.RUC))
                {
                    var proveedorConMismoRUC = await _productoService.ObtenerProveedorPorRUC(request.RUC);
                    if (proveedorConMismoRUC != null && proveedorConMismoRUC.Id != id)
                    {
                        return BadRequest(new { Message = "Ya existe un proveedor con este RUC" });
                    }
                }


                // Actualizar propiedades
                proveedorExistente.Nombre = request.Nombre;
                proveedorExistente.RUC = request.RUC;
                proveedorExistente.Telefono = request.Telefono;
                proveedorExistente.Email = request.Email;
                proveedorExistente.Direccion = request.Direccion;
                proveedorExistente.Contacto = request.Contacto;
                proveedorExistente.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();

                // Crear response
                var proveedorResponse = new ProveedorResponse
                {
                    Id = proveedorExistente.Id,
                    Nombre = proveedorExistente.Nombre,
                    RUC = proveedorExistente.RUC,
                    Direccion = proveedorExistente.Direccion,
                    Telefono = proveedorExistente.Telefono,
                    Email = proveedorExistente.Email,
                    Contacto = proveedorExistente.Contacto,
                    Estado = proveedorExistente.Estado,
                    FechaCreacion = proveedorExistente.FechaCreacion,
                    FechaActualizacion = proveedorExistente.FechaActualizacion
                };

                return Ok(new { Message = "Proveedor actualizado exitosamente", Proveedor = proveedorResponse });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> ActivarProveedor(int id)
        {
            try
            {
                var proveedor = await _productoService.ObtenerProveedor(id);
                if (proveedor == null)
                    return NotFound(new { Message = "Proveedor no encontrado" });

                // Activar el proveedor
                proveedor.Estado = true;
                proveedor.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Proveedor activado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProveedor(int id)
        {
            try
            {
                var proveedor = await _productoService.ObtenerProveedor(id);
                if (proveedor == null)
                    return NotFound(new { Message = "Proveedor no encontrado" });

                // Cambiar estado a inactivo en lugar de eliminar
                proveedor.Estado = false;
                proveedor.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Proveedor eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }
    }
}