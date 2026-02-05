import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component'; // Atenção: pode ser './app/app.component' dependendo de como salvou, mas no seu print era './app/app'
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;