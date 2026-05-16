import { Pipe, PipeTransform } from '@angular/core';
import { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';

@Pipe({
  name: 'displayWeight',
  standalone: true,
  pure: true,
})
export class DisplayWeightPipe implements PipeTransform {
  transform(kg: number, unit: PreferredUnit): string {
    if (unit === 'lb') {
      return `${(kg * 2.20462).toFixed(1)} lb`;
    }
    return `${kg} kg`;
  }
}
