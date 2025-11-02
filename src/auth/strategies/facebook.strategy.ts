import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get('FACEBOOK_APP_SECRET') || '',
      callbackURL: (configService.get('OAUTH_CALLBACK_URL') || '') + '/facebook',
      scope: ['email'],
      profileFields: ['emails', 'name', 'picture'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value,
      name: name?.givenName + ' ' + name?.familyName,
      avatarUrl: photos?.[0]?.value,
    };
    done(null, user);
  }
}
