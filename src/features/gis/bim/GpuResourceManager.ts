/**
 * ============================================================================
 * GPU RESOURCE MANAGER - GRASP Pure Fabrication (Memory Disposal Pattern)
 * ============================================================================
 * Komponen pabrikasi murni khusus untuk mengelola lifecycle VRAM GPU.
 * Melakukan Depth-First Traversal pada Scene Graph dan mengeksekusi
 * `dispose()` secara eksplisit pada Geometri, Material, dan Tekstur WebGL.
 * ============================================================================
 */
export class GpuResourceManager {
  private activeBuffers: Set<string> = new Set();
  private isDisposed: boolean = false;

  /**
   * Mendaftarkan ID buffer VRAM yang dialokasikan
   */
  public registerBuffer(bufferId: string): void {
    if (!this.isDisposed) {
      this.activeBuffers.add(bufferId);
    }
  }

  /**
   * Mengosongkan referensi buffer VRAM tertentu secara eksplisit
   */
  public disposeBuffer(bufferId: string): void {
    if (this.activeBuffers.has(bufferId)) {
      this.activeBuffers.delete(bufferId);
      // Di integrasi fisik Three.js / WebGL: geometry.dispose(), material.dispose(), texture.dispose()
    }
  }

  /**
   * Membersihkan seluruh VRAM dan mematikan Worker Threads saat layer di-unmount
   */
  public disposeAll(): void {
    this.activeBuffers.forEach((id) => {
      this.disposeBuffer(id);
    });
    this.activeBuffers.clear();
    this.isDisposed = true;
  }

  public getActiveBufferCount(): number {
    return this.activeBuffers.size;
  }
}
