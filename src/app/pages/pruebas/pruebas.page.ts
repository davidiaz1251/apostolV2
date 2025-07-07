import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonSpinner,
  IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline
} from 'ionicons/icons';

import { FirebaseService } from '../../services/firebase.service';
import { Tema, Practica } from '../../interfaces/tema.interface';

@Component({
  selector: 'app-pruebas',
  templateUrl: './pruebas.page.html',
  styleUrls: ['./pruebas.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon,
    IonBadge, IonList, IonItem, IonLabel, IonRadioGroup, IonRadio,
    IonSpinner, IonImg, CommonModule, FormsModule
  ]
})
export class PruebasPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firebaseService = inject(FirebaseService);

  temaId: string = '';
  tema: Tema | null = null;
  preguntas: Practica[] = [];
  currentIndex = 0;
  selectedAnswer = '';
  isAnswered = false;
  isCorrect = false;
  showResult = false;
  resultMessage = '';
  resultColor = '';
  buttonText = 'Siguiente';
  
  // Estadísticas
  correctAnswers = 0;
  totalAnswers = 0;
  showFinalResults = false;
  
  isLoading = true;
  error: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor() {
    addIcons({ 
      closeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.temaId = this.route.snapshot.paramMap.get('id') || '';
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async loadData() {
    try {
      this.isLoading = true;
      this.error = null;

      // Obtener el tema desde los observables
      const temasSub = this.firebaseService.temas$.subscribe(temas => {
        this.tema = temas.find(t => t.id === this.temaId) || null;
      });

      // Obtener las prácticas desde los observables o Firebase
      const practicasSub = this.firebaseService.practicas$.subscribe(async (practicasLocales) => {
        const practicasDelTema = practicasLocales.filter(p => p.tema === this.temaId);
        
        if (practicasDelTema.length > 0) {
          console.log('📚 Prácticas obtenidas desde local:', practicasDelTema.length);
          this.preguntas = practicasDelTema;
          this.isLoading = false;
        } else {
          // Si no hay prácticas locales, intentar obtener desde Firebase
          console.log('🔄 Obteniendo prácticas desde Firebase...');
          try {
            const practicasFirebase = await this.firebaseService.queryDocuments('Practicas', 'tema', '==', this.temaId);
            this.preguntas = practicasFirebase as Practica[];
            console.log('📡 Prácticas obtenidas desde Firebase:', this.preguntas.length);
          } catch (error) {
            console.error('❌ Error obteniendo prácticas desde Firebase:', error);
            this.error = 'No se pudieron cargar las preguntas';
          }
          this.isLoading = false;
        }
      });

      this.subscriptions.push(temasSub, practicasSub);

    } catch (error) {
      console.error('❌ Error loading data:', error);
      this.error = 'Error al cargar las preguntas';
      this.isLoading = false;
    }
  }

  checkAnswer() {
    if (!this.selectedAnswer || this.isAnswered) return;

    const currentQuestion = this.preguntas[this.currentIndex];
    this.isAnswered = true;
    this.showResult = true;
    this.totalAnswers++;

    if (this.selectedAnswer === currentQuestion.respuesta) {
      this.isCorrect = true;
      this.correctAnswers++;
      this.resultColor = 'success';
      this.resultMessage = '¡Excelente! Respuesta correcta.';
    } else {
      this.isCorrect = false;
      this.resultColor = 'danger';
      this.resultMessage = `Incorrecto. La respuesta correcta es: ${currentQuestion.respuesta}`;
    }

    // Actualizar texto del botón
    if (this.currentIndex === this.preguntas.length - 1) {
      this.buttonText = 'Ver Resultados';
    } else {
      this.buttonText = 'Siguiente';
    }
  }

  nextQuestion() {
    if (this.currentIndex === this.preguntas.length - 1) {
      // Mostrar resultados finales
      this.showFinalResults = true;
    } else {
      // Ir a la siguiente pregunta
      this.currentIndex++;
      this.resetQuestion();
    }
  }

  private resetQuestion() {
    this.selectedAnswer = '';
    this.isAnswered = false;
    this.showResult = false;
    this.isCorrect = false;
    this.resultMessage = '';
    this.buttonText = 'Comprobar';
  }

  restartQuiz() {
    this.currentIndex = 0;
    this.correctAnswers = 0;
    this.totalAnswers = 0;
    this.showFinalResults = false;
    this.resetQuestion();
  }

  goBack() {
    this.router.navigate(['/practices']);
  }

  getCurrentQuestion(): Practica | null {
    return this.preguntas[this.currentIndex] || null;
  }

  getProgressText(): string {
    return `${this.currentIndex + 1} de ${this.preguntas.length}`;
  }

  getScorePercentage(): number {
    return this.totalAnswers > 0 ? Math.round((this.correctAnswers / this.totalAnswers) * 100) : 0;
  }

  async retry() {
    await this.loadData();
  }
}
