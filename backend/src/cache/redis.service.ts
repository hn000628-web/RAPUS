import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService
implements OnModuleInit, OnModuleDestroy {

  private redis!: Redis;

  async onModuleInit(){

    this.redis = new Redis({

      host:
      process.env.REDIS_HOST
      || '127.0.0.1',

      port:
      Number(process.env.REDIS_PORT)
      || 6379,

    });

    this.redis.on('connect',()=>{

      console.log('⚡ Redis connected');

    });

    this.redis.on('error',(err)=>{

      console.error(
        'Redis error',
        err
      );

    });

  }

  async onModuleDestroy(){

    if(this.redis){

      await this.redis.quit();

    }

  }

  async get(key:string){

    const data=
    await this.redis.get(key);

    if(!data)
    return null;

    try{

      return JSON.parse(data);

    }catch{

      return null;

    }

  }

  async set(

    key:string,

    value:any,

    ttlSeconds=60

  ){

    await this.redis.set(

      key,

      JSON.stringify(value),

      'EX',

      ttlSeconds

    );

  }

  async del(key:string){

    await this.redis.del(key);

  }

}