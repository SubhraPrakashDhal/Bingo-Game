import crypto from 'crypto';
import { CoinChoice } from '../../../shared/types';

export class TossEngine {
  public static flipCoin(): CoinChoice {
    // Cryptographically secure, unbiased 50/50 coin flip
    const rand = crypto.randomInt(0, 2);

    return rand === 0 ? 'HEADS' : 'TAILS';
  }

  public static determineWinner(
    chooserChoice: CoinChoice,
    chooserId: string,
    otherPlayerId: string
  ): { outcome: CoinChoice; winnerId: string } {
    const outcome = this.flipCoin();

    const winnerId =
      chooserChoice === outcome
        ? chooserId
        : otherPlayerId;

    return {
      outcome,
      winnerId,
    };
  }
}