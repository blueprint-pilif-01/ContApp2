# Schema Notes (BV inspiration + ContApp target)

## BV schema sources

- `D:/JSprojects/bisericavertical/backend/scripts/init-database.js`
- `D:/JSprojects/bisericavertical/backend/config/database.js`

## Practical takeaways for ContApp backend

- Keep domain-separated tables:
  - contracts/templates/fields/invites/submissions
  - ticketing tasks
  - chat conversations/messages
  - users/roles/permissions
  - hr hours/leaves/reviews/certificates
  - legislation updates + preferences
  - planner events
  - notes + notebook docs
- Always expose list endpoints with filters for dashboard widgets and boards.
- Persist explicit status lifecycles:
  - ticketing: `todo | in_progress | blocked | done`
  - invites: `draft | sent | viewed | signed | expired`
  - HR leave: `pending | approved | rejected`
