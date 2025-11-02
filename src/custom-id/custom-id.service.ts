import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export enum CustomIdElementType {
  FIXED_TEXT = 'FIXED_TEXT',
  RANDOM_20BIT = 'RANDOM_20BIT',
  RANDOM_32BIT = 'RANDOM_32BIT',
  RANDOM_6DIGIT = 'RANDOM_6DIGIT',
  RANDOM_9DIGIT = 'RANDOM_9DIGIT',
  GUID = 'GUID',
  DATETIME = 'DATETIME',
  SEQUENCE = 'SEQUENCE',
}

export interface CustomIdElement {
  type: CustomIdElementType;
  value?: string;
  format?: string;
}

export interface CustomIdTemplate {
  elements: CustomIdElement[];
}

@Injectable()
export class CustomIdService {
  constructor(private prisma: PrismaService) {}

  async generateCustomId(
    inventoryId: string,
    template: CustomIdTemplate,
    overrides?: Partial<Record<number, string>>,
  ): Promise<string> {
    const parts: string[] = [];

    for (let i = 0; i < template.elements.length; i++) {
      const element = template.elements[i];

      if (overrides && overrides[i] !== undefined) {
        parts.push(overrides[i] as string);
        continue;
      }

      switch (element.type) {
        case CustomIdElementType.FIXED_TEXT:
          parts.push(element.value || '');
          break;

        case CustomIdElementType.RANDOM_20BIT:
          parts.push(this.generateRandomHex(20));
          break;

        case CustomIdElementType.RANDOM_32BIT:
          parts.push(this.generateRandomHex(32));
          break;

        case CustomIdElementType.RANDOM_6DIGIT:
          parts.push(this.generateRandomDigits(6));
          break;

        case CustomIdElementType.RANDOM_9DIGIT:
          parts.push(this.generateRandomDigits(9));
          break;

        case CustomIdElementType.GUID:
          parts.push(uuidv4());
          break;

        case CustomIdElementType.DATETIME:
          parts.push(this.formatDateTime(element.format));
          break;

        case CustomIdElementType.SEQUENCE:
          const seqValue = await this.getNextSequence(inventoryId);
          parts.push(seqValue.toString().padStart(6, '0'));
          break;

        default:
          throw new BadRequestException(`Unknown element type: ${element.type}`);
      }
    }

    return parts.join('');
  }

  async getNextSequence(inventoryId: string): Promise<number> {
    return await this.prisma.$transaction(async (tx) => {
      let sequence = await tx.customIdSequence.findUnique({
        where: { inventoryId },
      });

      if (!sequence) {
        sequence = await tx.customIdSequence.create({
          data: {
            inventoryId,
            template: {},
            nextValue: 1,
          },
        });
      }

      const currentValue = sequence.nextValue;

      await tx.customIdSequence.update({
        where: { inventoryId },
        data: { nextValue: currentValue + 1 },
      });

      return currentValue;
    });
  }

  generateSampleId(template: CustomIdTemplate): string {
    const parts: string[] = [];

    for (const element of template.elements) {
      switch (element.type) {
        case CustomIdElementType.FIXED_TEXT:
          parts.push(element.value || '');
          break;
        case CustomIdElementType.RANDOM_20BIT:
          parts.push(this.generateRandomHex(20));
          break;
        case CustomIdElementType.RANDOM_32BIT:
          parts.push(this.generateRandomHex(32));
          break;
        case CustomIdElementType.RANDOM_6DIGIT:
          parts.push(this.generateRandomDigits(6));
          break;
        case CustomIdElementType.RANDOM_9DIGIT:
          parts.push(this.generateRandomDigits(9));
          break;
        case CustomIdElementType.GUID:
          parts.push(uuidv4());
          break;
        case CustomIdElementType.DATETIME:
          parts.push(this.formatDateTime(element.format));
          break;
        case CustomIdElementType.SEQUENCE:
          parts.push('000001');
          break;
      }
    }

    return parts.join('');
  }

  validateCustomIdFormat(customId: string, template: CustomIdTemplate): boolean {
    const regex = this.generateRegexFromTemplate(template);
    return regex.test(customId);
  }

  generateRegexFromTemplate(template: CustomIdTemplate): RegExp {
    const parts: string[] = [];

    for (const element of template.elements) {
      switch (element.type) {
        case CustomIdElementType.FIXED_TEXT:
          parts.push(this.escapeRegex(element.value || ''));
          break;
        case CustomIdElementType.RANDOM_20BIT:
          parts.push('[0-9a-f]{5}');
          break;
        case CustomIdElementType.RANDOM_32BIT:
          parts.push('[0-9a-f]{8}');
          break;
        case CustomIdElementType.RANDOM_6DIGIT:
          parts.push('\\d{6}');
          break;
        case CustomIdElementType.RANDOM_9DIGIT:
          parts.push('\\d{9}');
          break;
        case CustomIdElementType.GUID:
          parts.push('[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}');
          break;
        case CustomIdElementType.DATETIME:
          parts.push('[0-9T:\\-Z]+');
          break;
        case CustomIdElementType.SEQUENCE:
          parts.push('\\d+');
          break;
      }
    }

    return new RegExp(`^${parts.join('')}$`, 'i');
  }

  private generateRandomHex(bits: number): string {
    const bytes = Math.ceil(bits / 8);
    const hex = Array.from({ length: bytes }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0'),
    ).join('');
    return hex.substring(0, Math.ceil(bits / 4));
  }

  private generateRandomDigits(length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }

  private formatDateTime(format?: string): string {
    const now = new Date();
    if (format === 'date') {
      return now.toISOString().split('T')[0];
    } else if (format === 'time') {
      return now.toISOString().split('T')[1].split('.')[0];
    }
    return now.toISOString();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
