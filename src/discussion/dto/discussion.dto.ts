import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDiscussionPostDto {
  @IsString()
  @IsNotEmpty()
  markdownText: string;
}
