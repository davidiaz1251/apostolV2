import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'video',
  standalone: true
})
export class VideoPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeResourceUrl {
    if (!value) return '';

    // Limpiar la URL del video
    let videoUrl = value.trim();

    // Convertir URLs de YouTube a formato embebido
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = this.extractYouTubeId(videoUrl);
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
      }
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
      }
    }

    // Convertir URLs de Vimeo a formato embebido
    if (videoUrl.includes('vimeo.com/')) {
      const videoId = this.extractVimeoId(videoUrl);
      if (videoId) {
        videoUrl = `https://player.vimeo.com/video/${videoId}?color=ffffff&title=0&byline=0&portrait=0`;
      }
    }

    // Agregar parámetros de seguridad para iframes
    if (videoUrl.includes('youtube.com/embed/') || videoUrl.includes('player.vimeo.com/')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    }

    // Para otras URLs de video, intentar usarlas directamente
    return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
  }

  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  private extractVimeoId(url: string): string | null {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }
}
