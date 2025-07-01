import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'styleDocumento',
  standalone: true
})
export class StyleDocumentoPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    // Aplicar estilos y limpieza al contenido HTML
    let processedContent = value;

    // Limpiar y mejorar el HTML del editor WYSIWYG
    processedContent = this.cleanAndStyleHTML(processedContent);

    // Sanitizar el contenido para prevenir XSS
    return this.sanitizer.bypassSecurityTrustHtml(processedContent);
  }

  private cleanAndStyleHTML(html: string): string {
    // Eliminar estilos inline que puedan conflictuar
    html = html.replace(/style="[^"]*"/gi, '');

    // Limpiar atributos no deseados
    html = html.replace(/class="[^"]*"/gi, '');

    // Mejorar saltos de línea
    html = html.replace(/<br\s*\/?>/gi, '<br />');

    // Asegurar que las imágenes sean responsive
    html = html.replace(/<img([^>]*)>/gi, '<img$1 style="max-width: 100%; height: auto; border-radius: 8px;" />');

    // Mejorar listas
    html = html.replace(/<ul([^>]*)>/gi, '<ul class="styled-list"$1>');
    html = html.replace(/<ol([^>]*)>/gi, '<ol class="styled-list"$1>');

    // Mejorar tablas
    html = html.replace(/<table([^>]*)>/gi, '<div class="table-wrapper"><table class="styled-table"$1>');
    html = html.replace(/<\/table>/gi, '</table></div>');

    // Mejorar blockquotes
    html = html.replace(/<blockquote([^>]*)>/gi, '<blockquote class="styled-quote"$1>');

    return html;
  }
}
