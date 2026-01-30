import { ApiProperty } from '@nestjs/swagger'

export class RegisterInputDTO {
  @ApiProperty({ type: String, required: true })
  name: string

  @ApiProperty({ type: String, required: true })
  email: string

  @ApiProperty({ type: String })
  phone?: string

  @ApiProperty({ type: String, required: true })
  password: string

  @ApiProperty({ type: String, required: true })
  turnstileToken: string

  @ApiProperty({ type: String, required: false, description: 'Invite code (required if REGISTRATION_MODE=invite_only)' })
  inviteCode?: string
}

export class LoginInputDTO {
  @ApiProperty({ type: String, required: true })
  email: string

  @ApiProperty({ type: String, required: true })
  password: string

  @ApiProperty({ type: String, required: true })
  turnstileToken: string
}

export class RequestResetPasswordInputDTO {
  @ApiProperty({ type: String, required: true })
  email: string

  @ApiProperty({ type: String, required: true })
  turnstileToken: string
}

export class ResetPasswordInputDTO {
  @ApiProperty({ type: String, required: true })
  email: string

  @ApiProperty({ type: String, required: true })
  otp: string

  @ApiProperty({ type: String, required: true })
  newPassword: string
}
