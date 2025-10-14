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
            });

            // Configuración de Proveedor
            modelBuilder.Entity<Proveedor>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(200);
                entity.Property(e => e.RUC).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.RUC).IsUnique();
                entity.Property(e => e.Estado).IsRequired().HasDefaultValue(true);
            });

            // Configuración de Producto
            modelBuilder.Entity<Producto>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Codigo).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Codigo).IsUnique();
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(200);
                entity.Property(e => e.PrecioCostoPromedio).HasColumnType("decimal(18,2)");
                entity.Property(e => e.PrecioVenta).HasColumnType("decimal(18,2)");
                entity.Property(e => e.MargenGanancia).HasColumnType("decimal(5,2)");

                entity.HasOne(p => p.Categoria)
                      .WithMany()
                      .HasForeignKey(p => p.CategoriaId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.UnidadMedidaBase)
                      .WithMany()
                      .HasForeignKey(p => p.UnidadMedidaBaseId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configuración de Compra
            modelBuilder.Entity<Compra>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NumeroFactura).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Subtotal).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Impuestos).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Estado).IsRequired().HasMaxLength(20);

                entity.HasOne(c => c.Proveedor)
                      .WithMany()
                      .HasForeignKey(c => c.ProveedorId)
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
            });
        }
    }
}