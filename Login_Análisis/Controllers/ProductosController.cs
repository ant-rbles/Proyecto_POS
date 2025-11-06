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
            var productos = await _productoService.ObtenerProductos();
            return Ok(productos);
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
                return BadRequest(new { Message = "Datos del producto inválidos", Errors = ModelState.Values.SelectMany(v => v.Errors) });
            }

            try
            {
                // Verificar si ya existe un producto con el mismo código
                var productoExistente = await _productoService.ObtenerProductoPorCodigo(request.Codigo);
                if (productoExistente != null)
                {
                    return BadRequest(new { Message = "Ya existe un producto con este código" });
                }

                // Verificar que la categoría existe
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

                var producto = new Producto
                {
                    Codigo = request.Codigo,
                    Nombre = request.Nombre,
                    Descripcion = request.Descripcion,
                    CategoriaId = request.CategoriaId,
                    UnidadMedidaBaseId = request.UnidadMedidaBaseId,
                    StockMinimo = request.StockMinimo,
                    MargenGanancia = request.MargenGanancia,
                    StockActual = 0,
                    PrecioCostoPromedio = 0,
                    PrecioVenta = 0,
                    Estado = true,
                    FechaCreacion = DateTime.UtcNow
                };

                var result = await _productoService.CrearProducto(producto);
                if (!result.success)
                    return BadRequest(new { Message = result.message });

                return Ok(new { Message = "Producto creado exitosamente", Producto = producto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno del servidor: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] object productData)
        {
            // Log para ver qué está llegando
            Console.WriteLine($"Datos recibidos para producto {id}: {System.Text.Json.JsonSerializer.Serialize(productData)}");

            try
            {
                // Convertir a Producto
                var jsonString = productData.ToString();
                var producto = System.Text.Json.JsonSerializer.Deserialize<Producto>(jsonString);

                if (producto == null)
                {
                    return BadRequest(new { Message = "No se pudo deserializar el producto" });
                }

                // Resto del código de actualización...
                var productoExistente = await _productoService.ObtenerProducto(id);
                if (productoExistente == null)
                    return NotFound(new { Message = "Producto no encontrado" });

                // Actualizar propiedades
                productoExistente.Codigo = producto.Codigo;
                productoExistente.Nombre = producto.Nombre;
                productoExistente.Descripcion = producto.Descripcion;
                productoExistente.CategoriaId = producto.CategoriaId;
                productoExistente.UnidadMedidaBaseId = producto.UnidadMedidaBaseId;
                productoExistente.StockMinimo = producto.StockMinimo;
                productoExistente.MargenGanancia = producto.MargenGanancia;
                productoExistente.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Producto actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Error interno del servidor: {ex.Message}" });
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