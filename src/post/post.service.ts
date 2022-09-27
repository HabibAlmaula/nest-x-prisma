import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async createPost(createPostDto: CreatePostDto, user: User) {
    try {
      const { title } = createPostDto;
      const isTitleExist = await this.prisma.post.findFirst({
        where: {
          title,
        },
      });
      if (isTitleExist) {
        return Promise.reject(new ForbiddenException('Title already exists'));
      }
      const result = await this.prisma.post.create({
        data: {
          title: createPostDto.title,
          content: createPostDto.content,
          published: createPostDto.published,
          authorId: user.id,
        },
      });
      return { message: 'post created successfully', result };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async getAllPosts(user: User) {
    try {
      const result = await this.prisma.post.findMany({
        where: {
          authorId: user.id,
        },
      });
      return { message: 'success', result };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
