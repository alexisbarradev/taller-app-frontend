import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-foro',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, RouterOutlet, RouterLink],
  styleUrl: './foro.component.css',
  templateUrl: './foro.component.html'
})
export class ForoComponent implements OnInit {
  topics: any[] = [];
  topicForm: FormGroup;
  mostrarFormulario = false;
  commentForms: { [key: number]: FormGroup } = {};
  commentsMap: { [key: number]: any[] } = {};
  mostrarComentarios: { [key: number]: boolean } = {};
  username: string = 'Usuario';
  role: string = 'Usuario';

  constructor(private http: HttpClient, private fb: FormBuilder, private userService: UserService) {
    this.topicForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.username = this.userService.getUsername();
    this.role = this.userService.getRole();
    this.obtenerTopics();
  }

  obtenerTopics() {
    this.http.get<any[]>('http://localhost:8081/api/topics/by-category/GENERAL')
      .subscribe(data => {
        this.topics = data;
        this.topics.forEach(topic => {
          this.commentForms[topic.id] = this.fb.group({ text: ['', Validators.required] });
          this.obtenerComentarios(topic.id);
        });
      });
  }

  onSubmit() {
    if (this.topicForm.invalid) return;
    const newTopic = {
      ...this.topicForm.value,
      author: this.username
    };
    this.http.post('http://localhost:8081/api/topics/create?categoryId=1', newTopic, {
      responseType: 'text'
    }).subscribe(() => {
      this.topicForm.reset();
      this.mostrarFormulario = false;
      this.obtenerTopics();
    });
  }

  obtenerComentarios(topicId: number) {
    this.http.get<any[]>(`http://localhost:8081/api/topics/${topicId}/comments`)
      .subscribe(data => this.commentsMap[topicId] = data);
  }

  enviarComentario(topicId: number) {
    const form = this.commentForms[topicId];
    if (form.invalid) return;
    const comment = {
      text: form.value.text,
      author: this.username
    };
    this.http.post(`http://localhost:8081/api/topics/${topicId}/comments`, comment).subscribe(() => {
      form.reset();
      this.obtenerComentarios(topicId);
    });
  }

  toggleComentarios(topicId: number) {
    this.mostrarComentarios[topicId] = !this.mostrarComentarios[topicId];
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }
} 