using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Mvc;
using Login_Análisis.DTOs;
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

        // Proveedores
        [HttpGet("proveedores")]
        public async Task<IActionResult> ObtenerProveedores()
        {
            var proveedores = await _productoService.ObtenerProveedores();
            return Ok(proveedores);
        }

        [HttpPost("proveedores")]
        public async Task<IActionResult> CrearProveedor([FromBody] Proveedor proveedor)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del proveedor inválidos" });
            }

            var result = await _productoService.CrearProveedor(proveedor);
            if (!result.success)
                return BadRequest(new { Message = result.message });

            return Ok(new { Message = result.message });
        }
        [HttpPut("proveedores/{id}")]
        public async Task<IActionResult> ActualizarProveedor(int id, [FromBody] Proveedor proveedor)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del proveedor inválidos" });
            }

            if (id != proveedor.Id)
            {
                return BadRequest(new { Message = "ID del proveedor no coincide" });
            }

            try
            {
                var proveedorExistente = await _productoService.ObtenerProveedor(id);
                if (proveedorExistente == null)
                    return NotFound(new { Message = "Proveedor no encontrado" });

                // Actualizar propiedades
                proveedorExistente.Nombre = proveedor.Nombre;
                proveedorExistente.RUC = proveedor.RUC;
                proveedorExistente.Telefono = proveedor.Telefono;
                proveedorExistente.Email = proveedor.Email;
                proveedorExistente.Direccion = proveedor.Direccion;
                proveedorExistente.Contacto = proveedor.Contacto;
                proveedorExistente.FechaActualizacion = DateTime.UtcNow;

                await _productoService.Context.SaveChangesAsync();
                return Ok(new { Message = "Proveedor actualizado exitosamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpDelete("proveedores/{id}")]
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

        // Unidades de Medida
        [HttpGet("unidades-medida")]
        public async Task<IActionResult> ObtenerUnidadesMedida()
        {
            var unidades = await _productoService.ObtenerUnidadesMedida();
            return Ok(unidades);
        }

        // Productos
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
        public async Task<IActionResult> CrearProducto([FromBody] Producto producto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del producto inválidos" });
            }

            try
            {
                // Verificar si ya existe un producto con el mismo código
                var productoExistente = await _productoService.ObtenerProductoPorCodigo(producto.Codigo);
                if (productoExistente != null)
                {
                    return BadRequest(new { Message = "Ya existe un producto con este código" });
                }

                _productoService.Context.Productos.Add(producto);
                await _productoService.Context.SaveChangesAsync();

                return Ok(new { Message = "Producto creado exitosamente", Producto = producto });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = $"Error: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] Producto producto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos del producto inválidos" });
            }

            if (id != producto.Id)
            {
                return BadRequest(new { Message = "ID del producto no coincide" });
            }

            try
            {
                var productoExistente = await _productoService.ObtenerProducto(id);
                if (productoExistente == null)
                    return NotFound(new { Message = "Producto no encontrado" });

                // Actualizar propiedades
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
                return BadRequest(new { Message = $"Error: {ex.Message}" });
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

        // Compras
        [HttpPost("compras")]
        public async Task<IActionResult> CrearCompra([FromBody] CompraRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { Message = "Datos de la compra inválidos" });
            }

            var compra = new Compra
            {
                NumeroFactura = request.NumeroFactura,
                ProveedorId = request.ProveedorId,
                FechaCompra = request.FechaCompra,
                Impuestos = request.Impuestos,
                Observaciones = request.Observaciones,
                UsuarioCreacion = request.UsuarioCreacion,
                FechaCreacion = DateTime.UtcNow
            };

            var result = await _productoService.CrearCompra(compra, request.Detalles);
            if (!result.success)
                return BadRequest(new { Message = result.message });

            return Ok(new { Message = result.message, Compra = result.compra });
        }

        [HttpGet("compras")]
        public async Task<IActionResult> ObtenerCompras([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
        {
            var compras = await _productoService.ObtenerCompras(fechaInicio, fechaFin);
            return Ok(compras);
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