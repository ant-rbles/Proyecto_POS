using Login_Análisis.Data;
using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UnidadesMedidaController : ControllerBase
    {
        private readonly ProductoService _productoService;
        private readonly ApplicationDbContext _context;

        public UnidadesMedidaController(ProductoService productoService, ApplicationDbContext context) 
        {
            _productoService = productoService;
            _context = context; 
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerUnidadesMedida()
        {
            try
            {
                var unidades = await _productoService.ObtenerUnidadesMedida();
                return Ok(unidades);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerUnidadMedida(int id)
        {
            try
            {
                var unidad = await _productoService.ObtenerUnidadMedida(id);
                if (unidad == null)
                    return NotFound(new { Message = "Unidad de medida no encontrada" });

                return Ok(unidad);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearUnidadMedida([FromBody] UnidadMedida unidadMedida)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos de la unidad de medida inválidos" });
            }

            try
            {
                // Si es unidad base, desmarcar otras unidades base
                if (unidadMedida.EsUnidadBase)
                {
                    var unidadesBase = await _context.UnidadesMedida
                        .Where(u => u.EsUnidadBase && u.Estado)
                        .ToListAsync();

                    foreach (var unidad in unidadesBase)
                    {
                        unidad.EsUnidadBase = false;
                    }
                }

                _context.UnidadesMedida.Add(unidadMedida);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Unidad de medida creada exitosamente", UnidadMedida = unidadMedida });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarUnidadMedida(int id, [FromBody] UnidadMedida unidadMedida)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos de la unidad de medida inválidos" });
            }

            if (id != unidadMedida.Id)
            {
                return BadRequest(new { Message = "ID de la unidad de medida no coincide" });
            }

            try
            {
                var unidadExistente = await _context.UnidadesMedida.FindAsync(id);
                if (unidadExistente == null)
                    return NotFound(new { Message = "Unidad de medida no encontrada" });

                // Si se está marcando como unidad base, desmarcar otras
                if (unidadMedida.EsUnidadBase && !unidadExistente.EsUnidadBase)
                {
                    var unidadesBase = await _context.UnidadesMedida
                        .Where(u => u.EsUnidadBase && u.Estado && u.Id != id)
                        .ToListAsync();

                    foreach (var unidad in unidadesBase)
                    {
                        unidad.EsUnidadBase = false;
                    }
                }

                // Actualizar propiedades
                unidadExistente.Nombre = unidadMedida.Nombre;
                unidadExistente.Abreviatura = unidadMedida.Abreviatura;
                unidadExistente.EsUnidadBase = unidadMedida.EsUnidadBase;
                unidadExistente.FactorConversion = unidadMedida.FactorConversion;

                await _context.SaveChangesAsync();
                return Ok(new { Message = "Unidad de medida actualizada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarUnidadMedida(int id)
        {
            try
            {
                var unidad = await _productoService.ObtenerUnidadMedida(id);
                if (unidad == null)
                    return NotFound(new { Message = "Unidad de medida no encontrada" });

                // Verificar si hay productos usando esta unidad
                var productosConUnidad = await _context.Productos
                    .AnyAsync(p => p.UnidadMedidaBaseId == id && p.Estado);

                if (productosConUnidad)
                {
                    return BadRequest(new { Message = "No se puede eliminar la unidad porque hay productos que la usan" });
                }

                unidad.Estado = false;
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Unidad de medida eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }
    }
}