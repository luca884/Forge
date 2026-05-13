import { Injectable } from '@angular/core';
import { ForgeDatabase } from './database';

@Injectable({ providedIn: 'root' })
export class ForgeDatabaseService extends ForgeDatabase {}
