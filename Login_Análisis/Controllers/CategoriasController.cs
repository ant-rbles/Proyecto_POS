using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public CategoriasController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerCategorias()
        {
            try
            {
                var categorias = await _productoService.ObtenerCategorias();
                return Ok(categorias);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerCategoria(int id)
        {
            try
            {
                var categoria = await _productoService.ObtenerCategoria(id);
                if (categoria == null)
                    return NotFound(new { Message = "Categoría no encontrada" });

                return Ok(categoria);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CrearCategoria([FromBody] Categoria categoria)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos de la categoría inválidos" });
            }

            try
            {
                // Verificar si ya existe una categoría con el mismo nombre
                var categoriaExistente = await _productoService.ObtenerCategoriaPorNombre(categoria.Nombre);
                if (categoriaExistente != null)
                {
                    return BadRequest(new { Message = "Ya existe una categoría con este nombre" });
                }

                var result = await _productoService.CrearCategoria(categoria);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = result.message, Categoria = categoria });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarCategoria(int id, [FromBody] Categoria categoria)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos de la categoría inválidos" });
            }

            if (id != categoria.Id)
            {
                return BadRequest(new { Message = "ID de la categoría no coincide" });
            }

            try
            {
                var categoriaExistente = await _productoService.ObtenerCategoria(id);
                if (categoriaExistente == null)
                    return NotFound(new { Message = "Categoría no encontrada" });

                // Verificar si otro categoría tiene el mismo nombre
                var categoriaConMismoNombre = await _productoService.ObtenerCategoriaPorNombre(categoria.Nombre);
                if (categoriaConMismoNombre != null && categoriaConMismoNombre.Id != id)
                {
                    return BadRequest(new { Message = "Ya existe una categoría con este nombre" });
                }

                // Actualizar propiedades
                categoriaExistente.Nombre = categoria.Nombre;
                categoriaExistente.Descripcion = categoria.Descripcion;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Categoría actualizada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarCategoria(int id)
        {
            try
            {
                var categoria = await _productoService.ObtenerCategoria(id);
                if (categoria == null)
                    return NotFound(new { Message = "Categoría no encontrada" });

                // Cambiar estado a inactivo en lugar de eliminar
                categoria.Estado = false;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Categoría eliminada exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }
    }
}