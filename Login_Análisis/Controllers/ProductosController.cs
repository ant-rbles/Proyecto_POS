using Login_Análisis.DTOs;
using Login_Análisis.DTOs.Requests;
using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Login_Análisis.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly ProductoService _productoService;

        public ProductosController(ProductoService productoService)
        {
            _productoService = productoService;
        }

        //Productos

        [HttpGet]
        public async Task<IActionResult> ObtenerProductos()
        {
            try
            {
                var productos = await _productoService.ObtenerProductos();

                Console.WriteLine($"Controlador - Productos recibidos: {productos?.Count ?? 0}");

                // Siempre devolver un array, aunque esté vacío
                return Ok(productos ?? new List<Producto>());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR en controlador: {ex.Message}");
                // Devolver array vacío en lugar de error
                return Ok(new List<object>());
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerProducto(int id)
        {
            var producto = await _productoService.ObtenerProducto(id);
            if (producto == null)
                return NotFound(new { Message = "Producto no encontrado" });

            return Ok(producto);
        }

        [HttpPost]
        public async Task<IActionResult> CrearProducto([FromBody] ProductRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    Message = "Datos del producto inválidos",
                    Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            try
            {
                // Verificar si ya existe un producto con el mismo código
                var productoExistente = await _productoService.ObtenerProductoPorCodigo(request.Codigo);
                if (productoExistente != null)
                {
                    return BadRequest(new { Message = "Ya existe un producto con este código" });
                }

                // Crear el producto con valores por defecto seguros
                var producto = new Producto
                {
                    Codigo = request.Codigo?.Trim() ?? throw new ArgumentException("El código es requerido"),
                    Nombre = request.Nombre?.Trim() ?? throw new ArgumentException("El nombre es requerido"),
                    Descripcion = request.Descripcion?.Trim() ?? "",
                    CategoriaId = request.CategoriaId,
                    UnidadMedidaBaseId = request.UnidadMedidaBaseId,
                    StockMinimo = request.StockMinimo >= 0 ? request.StockMinimo : 0,
                    MargenGanancia = request.MargenGanancia >= 0 ? request.MargenGanancia : 30,
                    StockActual = 0, // Siempre empezar en 0
                    PrecioCostoPromedio = 0, // Siempre empezar en 0
                    PrecioVenta = 0, // Se calculará después
                    Estado = true,
                    FechaCreacion = DateTime.UtcNow
                };

                var result = await _productoService.CrearProducto(producto);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new
                {
                    Message = "Producto creado exitosamente",
                    Producto = new
                    {
                        producto.Id,
                        producto.Codigo,
                        producto.Nombre,
                        producto.Descripcion,
                        producto.CategoriaId,
                        producto.UnidadMedidaBaseId,
                        producto.StockMinimo,
                        producto.StockActual,
                        producto.PrecioCostoPromedio,
                        producto.PrecioVenta,
                        producto.MargenGanancia,
                        producto.Estado,
                        producto.FechaCreacion
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = $"Error interno del servidor al crear producto: {ex.Message}"
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] ProductRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    Message = "Datos del producto inválidos",
                    Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            try
            {
                var productoExistente = await _productoService.ObtenerProducto(id);
                if (productoExistente == null)
                    return NotFound(new { Message = "Producto no encontrado" });

                // Verificar si otro producto tiene el mismo código (excluyendo el actual)
                var productoConMismoCodigo = await _productoService.ObtenerProductoPorCodigo(request.Codigo);
                if (productoConMismoCodigo != null && productoConMismoCodigo.Id != id)
                {
                    return BadRequest(new { Message = "Ya existe un producto con este código" });
                }

                // Verificar que la categoría existe si se proporciona
                if (request.CategoriaId.HasValue)
                {
                    var categoria = await _productoService.ObtenerCategoria(request.CategoriaId.Value);
                    if (categoria == null)
                        return BadRequest(new { Message = "La categoría especificada no existe" });
                }

                // Verificar que la unidad de medida existe
                var unidadMedida = await _productoService.ObtenerUnidadMedida(request.UnidadMedidaBaseId);
                if (unidadMedida == null)
                    return BadRequest(new { Message = "La unidad de medida especificada no existe" });

                // Actualizar SOLO los campos permitidos - NO tocar stock, precios, etc.
                productoExistente.Codigo = request.Codigo?.Trim();
                productoExistente.Nombre = request.Nombre?.Trim();
                productoExistente.Descripcion = request.Descripcion?.Trim() ?? "";
                productoExistente.CategoriaId = request.CategoriaId;
                productoExistente.UnidadMedidaBaseId = request.UnidadMedidaBaseId;
                productoExistente.StockMinimo = request.StockMinimo >= 0 ? request.StockMinimo : 0;
                productoExistente.MargenGanancia = request.MargenGanancia >= 0 ? request.MargenGanancia : 30;
                productoExistente.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Producto actualizado exitosamente",
                    Producto = new
                    {
                        productoExistente.Id,
                        productoExistente.Codigo,
                        productoExistente.Nombre,
                        productoExistente.Descripcion,
                        productoExistente.CategoriaId,
                        productoExistente.UnidadMedidaBaseId,
                        productoExistente.StockMinimo,
                        productoExistente.StockActual,
                        productoExistente.PrecioCostoPromedio,
                        productoExistente.PrecioVenta,
                        productoExistente.MargenGanancia,
                        productoExistente.Estado,
                        productoExistente.FechaCreacion,
                        productoExistente.FechaActualizacion
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = $"Error interno del servidor al actualizar producto: {ex.Message}"
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProducto(int id)
        {
            try
            {
                var producto = await _productoService.ObtenerProducto(id);
                if (producto == null)
                    return NotFound(new { Message = "Producto no encontrado" });

                producto.Estado = false;
                producto.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Producto eliminado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        // Conversión de unidades
        [HttpGet("convertir-unidad")]
        public async Task<IActionResult> ConvertirUnidad([FromQuery] int desdeUnidadId, [FromQuery] int aUnidadId, [FromQuery] decimal cantidad)
        {
            try
            {
                var resultado = await _productoService.ConvertirUnidad(desdeUnidadId, aUnidadId, cantidad);
                return Ok(new { CantidadConvertida = resultado });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }
}