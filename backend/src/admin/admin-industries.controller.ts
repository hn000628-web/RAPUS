import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  ParseIntPipe
} from '@nestjs/common'

import db from '../config/database'

@Controller('admin/industries')
export class AdminIndustriesController {

  /* ===============================
     전체 업종 조회
  =============================== */

  @Get()
  async getIndustries(){

    const rows = db.prepare(`
      SELECT
        id,
        code,
        name,
        categoryCode,
        isActive,
        sortOrder
      FROM industries
      ORDER BY sortOrder ASC,id ASC
    `).all()

    return {
      ok:true,
      industries:rows
    }

  }

  /* ===============================
     업종 추가
  =============================== */

  @Post()
  async createIndustry(
    @Body() body:{
      code:string
      name:string
      categoryCode:string
    }
  ){

    db.prepare(`
      INSERT INTO industries
      (code,name,categoryCode)
      VALUES (?,?,?)
    `).run(
      body.code,
      body.name,
      body.categoryCode
    )

    return { ok:true }

  }

  /* ===============================
     업종 수정
  =============================== */

  @Patch(':id')
  async updateIndustry(
    @Param('id',ParseIntPipe) id:number,
    @Body() body:{
      name?:string
      sortOrder?:number
      isActive?:number
    }
  ){

    db.prepare(`
      UPDATE industries
      SET
        name = COALESCE(?,name),
        sortOrder = COALESCE(?,sortOrder),
        isActive = COALESCE(?,isActive)
      WHERE id = ?
    `).run(
      body.name ?? null,
      body.sortOrder ?? null,
      body.isActive ?? null,
      id
    )

    return { ok:true }

  }

  /* ===============================
     삭제
  =============================== */

  @Delete(':id')
  async deleteIndustry(
    @Param('id',ParseIntPipe) id:number
  ){

    db.prepare(`
      DELETE FROM industries
      WHERE id = ?
    `).run(id)

    return { ok:true }

  }

}