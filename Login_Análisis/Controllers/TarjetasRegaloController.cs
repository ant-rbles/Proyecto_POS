using Login_Análisis.DTOs;
using Login_Análisis.Models;
using Login_Análisis.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class TarjetasRegaloController : ControllerBase
{
    private readonly TarjetaRegaloService _service;

    public TarjetasRegaloController(TarjetaRegaloService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        return Ok(await _service.Listar());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var t = await _service.Obtener(id);
        if (t == null) return NotFound();
        return Ok(t);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Cajero,Vendedor")]
    public async Task<IActionResult> Crear([FromBody] TarjetaRegaloRequest req)
    {
        if (req.SaldoActual < 0) return BadRequest("El saldo no puede ser negativo.");
        if (req.SaldoActual > req.MontoInicial) return BadRequest("El saldo inicial no puede superar el monto.");

        var tarjeta = new TarjetaRegalo
        {
            Codigo = req.Codigo,
            MontoInicial = req.MontoInicial,
            SaldoActual = req.SaldoActual,
            Moneda = req.Moneda,
            FechaEmision = DateTime.UtcNow,
            FechaExpiracion = req.FechaExpiracion,
            Estado = "Activa",
            UsuarioRegistro = req.UsuarioId,
            FechaRegistro = DateTime.UtcNow
        };

        var result = await _service.Crear(tarjeta);
        if (!result.success) return BadRequest(result.message);

        return Ok(result.message);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador,Cajero")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] TarjetaRegaloUpdateRequest req)
    {
        var result = await _service.Actualizar(id, req);
        if (!result.success) return BadRequest(result.message);

        return Ok(result.message);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Anular(int id, [FromQuery] int usuarioId)
    {
        var result = await _service.Anular(id, usuarioId);
        if (!result.success) return BadRequest(result.message);

        return Ok(result.message);
    }
}

