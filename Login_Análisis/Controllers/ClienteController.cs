using Login_Análisis.DTOs;
using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public ClientesController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpGet("todos")]
        public async Task<IActionResult> ObtenerTodosClientes()
        {
            try
            {
                var clientes = await _productoService.ObtenerTodosClientesAsync();
                return Ok(clientes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerCliente(int id)
        {
            try
            {
                var cliente = await _productoService.ObtenerCliente(id);
                if (cliente == null)
                    return NotFound(new { Message = "Cliente no encontrado" });

                return Ok(cliente);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("buscar-por-nit/{nit}")]
        public async Task<IActionResult> BuscarClientePorNIT(string nit)
        {
            try
            {
                var cliente = await _productoService.ObtenerClientePorNIT(nit);
                if (cliente == null)
                    return NotFound(new { Message = "Cliente no encontrado" });

                return Ok(cliente);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearCliente([FromBody] ClienteRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del cliente inválidos" });
            }

            try
            {
                if (!string.IsNullOrEmpty(request.NIT))
                {
                    var clienteExistente = await _productoService.ObtenerClientePorNIT(request.NIT);
                    if (clienteExistente != null)
                    {
                        return BadRequest(new { Message = "Ya existe un cliente con este NIT" });
                    }
                }

                var cliente = new Cliente
                {
                    Nombre = request.Nombre,
                    NIT = request.NIT,
                    Direccion = request.Direccion,
                    Telefono = request.Telefono,
                    Email = request.Email,
                    Estado = true,
                    FechaCreacion = DateTime.UtcNow
                };

                var result = await _productoService.CrearCliente(cliente);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message, Cliente = cliente });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarCliente(int id, [FromBody] ClienteRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del cliente inválidos" });
            }

            try
            {
                var clienteExistente = await _productoService.ObtenerCliente(id);
                if (clienteExistente == null)
                    return NotFound(new { Message = "Cliente no encontrado" });

                if (!string.IsNullOrEmpty(request.NIT))
                {
                    var clienteConMismoNIT = await _productoService.ObtenerClientePorNIT(request.NIT);
                    if (clienteConMismoNIT != null && clienteConMismoNIT.Id != id)
                    {
                        return BadRequest(new { Message = "Ya existe un cliente con este NIT" });
                    }
                }

                // Actualizar propiedades
                clienteExistente.Nombre = request.Nombre;
                clienteExistente.NIT = request.NIT;
                clienteExistente.Direccion = request.Direccion;
                clienteExistente.Telefono = request.Telefono;
                clienteExistente.Email = request.Email;
                clienteExistente.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Cliente actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> ActivarCliente(int id)
        {
            try
            {
                var cliente = await _productoService.ObtenerCliente(id);
                if (cliente == null)
                    return NotFound(new { Message = "Cliente no encontrado" });

                // Activar el cliente
                cliente.Estado = true;
                cliente.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Cliente activado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarCliente(int id)
        {
            try
            {
                var cliente = await _productoService.ObtenerCliente(id);
                if (cliente == null)
                    return NotFound(new { Message = "Cliente no encontrado" });

                // Cambiar estado a inactivo en lugar de eliminar
                cliente.Estado = false;
                cliente.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Cliente eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }
    }
}