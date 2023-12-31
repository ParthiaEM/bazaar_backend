import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDTO } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async isUserIdExist(userId): Promise<boolean> {
    const users = await this.userRepository.findOne({ where: { userId } });
    return !!users;
  }

  async create(user: User) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.userPassword, saltRounds);
    user.userPassword = hashedPassword;

    return await this.userRepository.save(user);
  }

  async findOne(userUniqueId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userUniqueId } });
    if (user) return user;
    throw new HttpException('사용자 없음', HttpStatus.NOT_FOUND);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.userId) {
      const userCheck = await this.userRepository.findOne({
        where: { userId: updateUserDto.userId },
      });
      if (userCheck) throw new ConflictException();
    }
    return await this.userRepository.update(id, updateUserDto);
  }
  async updateLux(userUniqueId: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { userUniqueId } });
    user.lux += updateUserDto.lux;
    return await this.userRepository.update(userUniqueId, user);
  }

  async login(loginuserDTO: LoginUserDTO) {
    const userId = loginuserDTO.userId;
    const userData = await this.userRepository.findOne({ where: { userId } });
    if (!userData) throw new NotFoundException();
    const { userPassword } = userData;
    if (!userData) return;
    const isPasswordMatch = await bcrypt.compare(
      loginuserDTO.userPassword,
      userPassword,
    );
    if (isPasswordMatch) {
      userData.userPassword = undefined;
      return userData;
    }
    return false;
  }

  async getById(userUniqueId: number) {
    return await this.userRepository.findOne({ where: { userUniqueId } });
  }
}
