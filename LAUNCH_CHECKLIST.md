# BidChip v2 — Launch Checklist

## Pre-launch (staging verified)
- [ ] All ETL migrations run and etl_verify_migration passes
- [ ] Stripe production keys set (not test keys)
- [ ] Stripe webhook endpoint registered at https://api.bidchip.com/api/v1/payments/stripe/webhook/
- [ ] SES production access granted (out of sandbox)
- [ ] UPS negotiated rates enabled on account 312V5W
- [ ] FedEx production credentials set
- [ ] Anthropic API key set (production)
- [ ] NEXTAUTH_SECRET set to a secure random value
- [ ] Custom domain configured in Amplify (bidchip.com → main branch)
- [ ] CloudFront/Amplify HTTPS verified
- [ ] Security headers verified (securityheaders.com)

## Cutover steps
1. Put legacy site in maintenance mode
2. Final ETL run (incremental since last run)
3. Run etl_verify_migration on prod
4. DNS cutover: bidchip.com → Amplify, api.bidchip.com → ALB
5. Verify health checks pass
6. Send "We're back" email to existing members
7. Monitor Sentry + CloudWatch for first 24 hours

## Rollback plan
- DNS revert takes ~5 minutes (low TTL set before cutover)
- Legacy site stays running until 30 days post-launch
- No data written to legacy DB after cutover
