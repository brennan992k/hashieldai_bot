export enum Plan {
  Basic = 0,
  Pro = 1,
  Ultimate = 2,
}

export type SubscriptionData = {
  plan: Plan;
  expiredTime: bigint;
};
