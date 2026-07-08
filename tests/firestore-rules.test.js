import { describe, it } from "node:test";
import assert from "node:assert";
import { readFile } from "node:fs/promises";

describe("Firestore rules monetization and ownership gates", () => {
    it("defines and validates launch plan tiers and statuses", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /validPlanTier\(tier\)[\s\S]*\['free', 'coach', 'premium'\]/);
        assert.match(rules, /validPlanStatus\(status\)[\s\S]*\['active', 'trialing', 'past_due', 'canceled'\]/);
    });

    it("prevents regular users from changing their own plan fields", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /!request\.resource\.data\.diff\(resource\.data\)\.affectedKeys\(\)\.hasAny\(\['planTier', 'planStatus', 'planUpdatedAt'\]\)/);
    });

    it("allows only admins to update plan fields directly", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /allow update: if isAdmin\(\)[\s\S]*affectedKeys\(\)\.hasOnly\(\['planTier', 'planStatus', 'planUpdatedAt'\]\)/);
    });

    it("keeps ratings owner or coach scoped", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /resource\.data\.userId == request\.auth\.uid/);
        assert.match(rules, /isCoachForTeam\(resource\.data\.teamId\)/);
        assert.match(rules, /request\.resource\.data\.userId == request\.auth\.uid/);
    });

    it("keeps basketball and football ratings admin-only", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /match \/basketballRatings\/\{ratingId\} \{\s*allow read, create, update, delete: if isAdmin\(\);/);
        assert.match(rules, /match \/footballRatings\/\{ratingId\} \{\s*allow read, create, update, delete: if isAdmin\(\);/);
    });

    it("requires coaches to own teams before updating or deleting them", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /match \/teams\/\{teamId\}[\s\S]*allow create: if signedIn\(\)[\s\S]*teamId == request\.auth\.uid/);
        assert.match(rules, /allow update: if isCoachForTeam\(teamId\)/);
        assert.match(rules, /allow delete: if isCoachForTeam\(teamId\)/);
    });

    it("requires invite-code and team existence checks for team membership", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /match \/teamMembers\/\{memberId\}[\s\S]*teamExists\(request\.resource\.data\.teamId\)/);
        assert.match(rules, /request\.resource\.data\.teamCode == teamData\(request\.resource\.data\.teamId\)\.teamCode/);
        assert.match(rules, /exists\(\/databases\/\$\(database\)\/documents\/teamJoinRequests\/\$\(memberId\)\)/);
        assert.match(rules, /get\(\/databases\/\$\(database\)\/documents\/teamJoinRequests\/\$\(memberId\)\)\.data\.status == 'approved'/);
    });

    it("keeps join requests owner-created and coach-reviewed", async () => {
        const rules = await readFile("firestore.rules", "utf8");
        assert.match(rules, /match \/teamJoinRequests\/\{requestId\}[\s\S]*requestId == request\.auth\.uid/);
        assert.match(rules, /request\.resource\.data\.status == 'pending'/);
        assert.match(rules, /allow update: if isCoachForTeam\(resource\.data\.teamId\)/);
        assert.match(rules, /request\.resource\.data\.status in \['approved', 'rejected'\]/);
    });
});
