import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

@Injectable()
export class FilesService {
  private imagekit: ImageKit;

  constructor(private configService: ConfigService) {
    this.imagekit = new ImageKit({
      publicKey: this.configService.get<string>('IMAGEKIT_PUBLIC_KEY') || '',
      privateKey: this.configService.get<string>('IMAGEKIT_PRIVATE_KEY') || '',
      urlEndpoint: this.configService.get<string>('IMAGEKIT_URL_ENDPOINT') || '',
    });
  }

  /**
   * Subir imagen desde base64
   */
  async uploadBase64Image(
    base64Data: string,
    fileName: string,
    folder: string = 'general',
  ): Promise<{ url: string; fileId: string; name: string }> {
    try {
      // Validar que sea base64 válido
      if (!base64Data.includes('base64,')) {
        throw new BadRequestException('Formato de imagen inválido. Debe ser base64');
      }

      const uploadResponse = await this.imagekit.upload({
        file: base64Data,
        fileName: `${Date.now()}_${fileName}`,
        folder: `renova/${folder}`,
        useUniqueFileName: true,
      });

      return {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
      };
    } catch (error) {
      console.error('Error subiendo imagen a ImageKit:', error);
      throw new InternalServerErrorException('Error al subir la imagen');
    }
  }

  /**
   * Subir múltiples imágenes
   */
  async uploadMultipleImages(
    images: string[],
    folder: string = 'general',
  ): Promise<Array<{ url: string; fileId: string; name: string }>> {
    const uploadPromises = images.map((base64, index) =>
      this.uploadBase64Image(base64, `image_${index}`, folder),
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Eliminar imagen de ImageKit
   */
  async deleteImage(fileId: string): Promise<void> {
    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      console.error('Error eliminando imagen de ImageKit:', error);
      throw new InternalServerErrorException('Error al eliminar la imagen');
    }
  }

  /**
   * Obtener detalles de una imagen
   */
  async getImageDetails(fileId: string): Promise<any> {
    try {
      return await this.imagekit.getFileDetails(fileId);
    } catch (error) {
      console.error('Error obteniendo detalles de imagen:', error);
      throw new InternalServerErrorException('Error al obtener detalles de la imagen');
    }
  }

  /**
   * Obtener parámetros de autenticación para upload desde frontend
   */
  getAuthenticationParameters() {
    return this.imagekit.getAuthenticationParameters();
  }
}
