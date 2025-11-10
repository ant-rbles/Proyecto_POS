using Login_Análisis.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace Login_Análisis.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Proveedor> Proveedores { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<UnidadMedida> UnidadesMedida { get; set; }
        public DbSet<Producto> Productos { get; set; }
        public DbSet<Compra> Compras { get; set; }
        public DbSet<DetalleCompra> DetalleCompras { get; set; }
        public DbSet<MovimientoInventario> MovimientosInventario { get; set; }
        public DbSet<Venta> Venta { get; set; }
        public DbSet<DetalleVenta> DetalleVenta { get; set; }
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<DescuentoProducto> DescuentosProducto { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuraciones de User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Usuario).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Usuario).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PasswordResetToken).HasMaxLength(500);
            });

            // Configuración de Proveedor
            modelBuilder.Entity<Proveedor>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(200);
                entity.Property(e => e.RUC).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.RUC).IsUnique();
                entity.Property(e => e.Direccion).HasMaxLength(500);
                entity.Property(e => e.Telefono).HasMaxLength(20);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Contacto).HasMaxLength(100);
                entity.Property(e => e.Estado).IsRequired().HasDefaultValue(true);
            });

            // Configuración de Categoria
            modelBuilder.Entity<Categoria>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Descripcion).HasMaxLength(500);
                entity.Property(e => e.Estado).IsRequired().HasDefaultValue(true);
            });

            // Configuración de UnidadMedida
            modelBuilder.Entity<UnidadMedida>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Abreviatura).IsRequired().HasMaxLength(10);
                entity.Property(e => e.FactorConversion).HasColumnType("decimal(18,6)");
                entity.Property(e => e.Estado).IsRequired().HasDefaultValue(true);
            });

            // Configuración de Producto
            modelBuilder.Entity<Producto>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Codigo).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Codigo).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Descripcion).HasMaxLength(500);
                entity.Property(e => e.StockMinimo).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.StockActual).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.PrecioCostoPromedio).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.PrecioVenta).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.MargenGanancia).HasColumnType("decimal(5,2)").HasDefaultValue(30);
                entity.Property(e => e.Estado).IsRequired().HasDefaultValue(true);

                entity.HasOne(p => p.Categoria)
                      .WithMany()
                      .HasForeignKey(p => p.CategoriaId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.UnidadMedidaBase)
                      .WithMany()
                      .HasForeignKey(p => p.UnidadMedidaBaseId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.Proveedor)
                      .WithMany(pr => pr.Productos)
                      .HasForeignKey(p => p.ProveedorId)
                      .OnDelete(DeleteBehavior.SetNull);

            });

            // Configuración de Compra
            modelBuilder.Entity<Compra>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumeroFactura).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.NumeroFactura).IsUnique();
                entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Impuestos).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Observaciones).HasMaxLength(1000);
                entity.Property(e => e.Estado).IsRequired().HasMaxLength(20).HasDefaultValue("PENDIENTE");

                entity.HasOne(c => c.Proveedor)
                      .WithMany()
                      .HasForeignKey(c => c.ProveedorId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.UsuarioCreacionNavigation)
                        .WithMany()
                        .HasForeignKey(c => c.UsuarioCreacion)
                        .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de DetalleCompra
            modelBuilder.Entity<DetalleCompra>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Cantidad).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CantidadBase).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PrecioUnitario).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalLinea).HasColumnType("decimal(18,2)");

                entity.HasOne(d => d.Compra)
                      .WithMany(c => c.Detalles)
                      .HasForeignKey(d => d.CompraId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Producto)
                      .WithMany()
                      .HasForeignKey(d => d.ProductoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.UnidadMedida)
                      .WithMany()
                      .HasForeignKey(d => d.UnidadMedidaId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Venta
            modelBuilder.Entity<Venta>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumeroFactura).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.NumeroFactura).IsUnique();
                entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Impuestos).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Observaciones).HasMaxLength(1000);
                entity.Property(e => e.Estado).IsRequired().HasMaxLength(20).HasDefaultValue("COMPLETADA");
                entity.Property(e => e.NombreCliente).HasMaxLength(200);
                entity.Property(e => e.NITCliente).HasMaxLength(20);
                entity.Property(e => e.DescuentoGlobal).HasColumnType("decimal(18,2)").HasDefaultValue(0);
                entity.Property(e => e.AplicarIVA).IsRequired().HasDefaultValue(true);

                entity.HasOne(v => v.Cliente)
                      .WithMany()
                      .HasForeignKey(v => v.ClienteId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(v => v.Usuario)
                       .WithMany(u => u.VentasCreadas)
                       .HasForeignKey(v => v.UsuarioCreacion)
                       .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de DetalleVenta
            modelBuilder.Entity<DetalleVenta>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Cantidad).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CantidadBase).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PrecioUnitario).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalLinea).HasColumnType("decimal(18,2)");
                entity.Property(e => e.DescuentoAplicado).HasColumnType("decimal(5,2)").HasDefaultValue(0);

                entity.HasOne(d => d.Venta)
                      .WithMany(v => v.Detalles)
                      .HasForeignKey(d => d.VentaId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.Producto)
                      .WithMany()
                      .HasForeignKey(d => d.ProductoId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.UnidadMedida)
                      .WithMany()
                      .HasForeignKey(d => d.UnidadMedidaId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de MovimientoInventario
            modelBuilder.Entity<MovimientoInventario>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TipoMovimiento).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Cantidad).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CantidadAnterior).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CantidadNueva).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PrecioCosto).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PrecioVenta).HasColumnType("decimal(18,2)");
                entity.Property(e => e.ReferenciaTipo).HasMaxLength(50);
                entity.Property(e => e.Observaciones).HasMaxLength(500);

                entity.HasOne(m => m.Producto)
                      .WithMany()
                      .HasForeignKey(m => m.ProductoId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Cliente
            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(200);
                entity.Property(e => e.NIT).HasMaxLength(20);
                entity.HasIndex(e => e.NIT); // Índice para búsqueda rápida por NIT
                entity.Property(e => e.Direccion).HasMaxLength(500);
                entity.Property(e => e.Telefono).HasMaxLength(20);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Estado).IsRequired().HasDefaultValue(true);
            });

            // Configuración de DescuentoProducto
            modelBuilder.Entity<DescuentoProducto>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CantidadMinima).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PorcentajeDescuento).HasColumnType("decimal(5,2)");
                entity.Property(e => e.Estado).IsRequired().HasDefaultValue(true);

                entity.HasOne(d => d.Producto)
                      .WithMany()
                      .HasForeignKey(d => d.ProductoId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}