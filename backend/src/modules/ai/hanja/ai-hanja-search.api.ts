import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common'
import {
  AiHanjaSearchService,
  HanjaTokenType,
} from './ai-hanja-search.service'

@Controller('ai/hanja/search')
export class AiHanjaSearchApi {
  constructor(private readonly searchService: AiHanjaSearchService) {}

  @Get('hanja')
  searchByHanja(@Query('hanja') hanja: string) {
    const trimmed = this.normalizeInput(hanja)
    if (!trimmed) {
      throw new BadRequestException('hanja is required')
    }

    const data = this.searchService.findByHanja(trimmed)
    return {
      ok: true,
      data,
    }
  }

  @Get('unicode/escape')
  searchByUnicodeEscape(@Query('unicodeEscape') unicodeEscape: string) {
    const trimmed = this.normalizeInput(unicodeEscape)
    if (!trimmed) {
      throw new BadRequestException('unicodeEscape is required')
    }

    const data = this.searchService.findByUnicodeEscape(trimmed)
    return {
      ok: true,
      data,
    }
  }

  @Get('unicode/decimal')
  searchByUnicodeDecimal(@Query('unicodeDecimal') unicodeDecimal: string | number) {
    const parsed = this.normalizeNumber(unicodeDecimal)
    if (parsed === null) {
      throw new BadRequestException('unicodeDecimal must be a positive integer')
    }

    const data = this.searchService.findByUnicodeDecimal(parsed)
    return {
      ok: true,
      data,
    }
  }

  @Get('token')
  searchByToken(
    @Query('token') token: string,
    @Query('limit') limit?: string | number
  ) {
    const normalizedToken = this.normalizeInput(token)
    if (!normalizedToken) {
      throw new BadRequestException('token is required')
    }

    const parsedLimit = this.normalizeLimit(limit)
    const results = this.searchService.searchByToken(normalizedToken, parsedLimit)
    return {
      ok: true,
      data: results,
      count: results.length,
    }
  }

  @Get('token-type')
  searchByTokenType(
    @Query('tokenType') tokenType: string,
    @Query('token') token: string,
    @Query('limit') limit?: string | number
  ) {
    const normalizedType = this.normalizeInput(tokenType)
    const normalizedToken = this.normalizeInput(token)
    const parsedLimit = this.normalizeLimit(limit)

    if (!normalizedType || !normalizedToken) {
      throw new BadRequestException('tokenType and token are required')
    }
    if (!this.isValidTokenType(normalizedType)) {
      throw new BadRequestException(`invalid tokenType: ${normalizedType}`)
    }

    const results = this.searchService.searchByTokenType(
      normalizedType,
      normalizedToken,
      parsedLimit
    )

    return {
      ok: true,
      data: results,
      count: results.length,
      tokenType: normalizedType,
    }
  }

  @Get('advanced')
  advancedSearch(
    @Query('query') query: string,
    @Query('level') level?: string,
    @Query('radical') radical?: string,
    @Query('strokes') strokes?: string | number,
    @Query('limit') limit?: string | number
  ) {
    const normalizedQuery = this.normalizeInput(query)
    if (!normalizedQuery) {
      throw new BadRequestException('query is required')
    }

    const parsedLimit = this.normalizeLimit(limit)
    const parsedStrokes = this.normalizeOptionalNumber(strokes)

    const results = this.searchService.search({
      query: normalizedQuery,
      level: this.normalizeInput(level),
      radical: this.normalizeInput(radical),
      strokes: parsedStrokes,
      limit: parsedLimit,
    })

    return {
      ok: true,
      data: results,
      count: results.length,
      query: normalizedQuery,
    }
  }

  private normalizeInput(value?: string): string {
    return String(value ?? '').trim()
  }

  private normalizeLimit(value?: string | number): number {
    if (value === undefined || value === null || value === '') {
      return 30
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30
  }

  private normalizeNumber(value?: string | number): number | null {
    if (value === undefined || value === null || value === '') {
      return null
    }

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null
    }

    return Math.trunc(parsed)
  }

  private normalizeOptionalNumber(value?: string | number): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined
    }

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return undefined
    }

    return Math.trunc(parsed)
  }

  private isValidTokenType(value: string): value is HanjaTokenType {
    return (
      value === 'hanja' ||
      value === 'mainSound' ||
      value === 'level' ||
      value === 'radical' ||
      value === 'strokes' ||
      value === 'totalStrokes' ||
      value === 'unicodeHex' ||
      value === 'unicodeEscape' ||
      value === 'unicodeDecimal' ||
      value === 'meaning'
    )
  }
}
