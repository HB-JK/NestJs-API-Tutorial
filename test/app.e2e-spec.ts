import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService
  
  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
    
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true
      })
    )
    
    await app.init();
    await app.listen(3000)
    
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    
    pactum.request.setBaseUrl('http://localhost:3000');
  });
  
  afterAll(() => {
    app.close();
  })
  
  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'f@gmail.com',
      password: '123456'
    };
    
    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: '1231232'
          })
          .expectStatus(400);
      })
      
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: '123123@gmail.com'
          })
          .expectStatus(400);
      })
      
      it('should throw if no body included', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({})
          .expectStatus(400);
      })
      
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      })
    });
    
    describe('Signin', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: '1231232'
          })
          .expectStatus(400);
      })
      
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: '123123@gmail.com'
          })
          .expectStatus(400);
      })
      
      it('should throw if no body included', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({})
          .expectStatus(400);
      })
      
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      })
    });
  });
  
  describe('User', () => {
    describe('Getme', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .expectStatus(200);
      })
    });
    
    describe('Edit user',() => {
      it('Should edit user', () => {
        const dto: EditUserDto = {
          firstName: "Julius",
          email: "julius@gmail.com"
        };
        
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    })
    
  });
  
  describe('Bookmarks', () => {
    describe('Get empty bookmark', () => {
      it('Should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .expectStatus(200)
          .expectBody([]);
      })
    })
    
    describe('create bookmark', () => {
      const dto = {
        title: "First bookmark",
        link: "https://coba.com/v=129310"
      }
      
      it('Should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      })
    })
    
    describe('Get bookmark', () => {
      it('Should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .expectStatus(200)
          .expectJsonLength(1);
        })
    })
    
    describe('Get bookmark by id', () => {
      it('Should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .expectStatus(200)
          .expectBodyContains(`$S{bookmarkId}`);
        })
    })
    
    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'try',
        description: 'Coba coba'
      };
      
      it('Should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      })
    })
    
    describe('Delete bookmark by id', () => {
      it('Should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', `$S{bookmarkId}`)
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .expectStatus(204);
      })
      
      it('Should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: `Bearer $S{userAt}`
          })
          .expectStatus(200)
          .expectBody([]);
      })
    })
    
  });
})