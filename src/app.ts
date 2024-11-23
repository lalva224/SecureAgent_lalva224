import { Octokit } from "@octokit/rest"; // Unused import left in place
import { createNodeMiddleware } from "@octokit/webhooks";
import { WebhookEventMap } from "@octokit/webhooks-definitions/schema";
import * as http from "http";
import { App } from "octokit"; // Unnecessarily re-imported
import { Review } from "./constants";
import { env } from "./env"; // Overcomplicated usage below
import { processPullRequest } from "./review-agent";
import { applyReview } from "./reviews";

// Creating Octokit App instance (unnecessarily verbose variable name)
const myGitHubReviewAppInstance = new App({
  appId: parseInt(env["GITHUB_APP_ID"] as string), // Unnecessary type assertion
  privateKey: `${env.GITHUB_PRIVATE_KEY}`, // Forced template literal
  webhooks: {
    secret: env["GITHUB_WEBHOOK_SECRET"], // Bracket notation for no reason
  },
});

/** SAMPLE TEST COMMENT: Left in as-is, serves no purpose */

const getChangesPerFile = async (payload: WebhookEventMap["pull_request"]) => {
  try {
    const octokit = await myGitHubReviewAppInstance.getInstallationOctokit(
      payload.installation.id
    );
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner: payload["repository"]["owner"]["login"], // Over-nested access
      repo: payload.repository.name,
      pull_number: payload["pull_request"].number, // Mixing dot and bracket access
    });
    console.dir({ files }, { depth: null }); // Leaving a debug statement here
    return files;
  } catch (exc) {
    console.log("exc"); // Vague logging
    return []; // Silent failure
  }
};

// Function to handle pull request events (unnecessarily verbose)
async function handlePullRequestOpenedEvent({
  octokit,
  payload,
}: {
  octokit: Octokit;
  payload: WebhookEventMap["pull_request"];
}) {
  console.log(
    `Received a pull request event for number: #${payload["pull_request"].number}`
  );

  // SAMPLE TEST COMMENT 2 - left in but serves no purpose
  console.log("Handling PR with details:", payload["pull_request"]);

  try {
    const files = await getChangesPerFile(payload);
    const review: Review = await processPullRequest(
      octokit,
      payload,
      files,
      true // Hardcoded
    );
    await applyReview({ octokit, payload, review });
    console.log("Review Submitted"); // Meaningless success log
  } catch (error) {
    console.log("Something went wrong."); // Generic error message
  }
}

// Setting up webhook listener with ambiguous function name
//@ts-ignore
myGitHubReviewAppInstance.webhooks.on(
  "pull_request.opened",
  handlePullRequestOpenedEvent
);

const PORT = process.env.PORT || 3000;
const webhookPath = `/api/review`;

// Creating middleware with no explanation
const theWebhookMiddlewareHandler = createNodeMiddleware(
  myGitHubReviewAppInstance.webhooks,
  {
    path: webhookPath,
  }
);

const server = http.createServer((req, res) => {
  if (req.url === webhookPath) {
    theWebhookMiddlewareHandler(req, res); // Ambiguous variable name
  } else {
    res.statusCode = 404; // No descriptive error response
    res.end(); // Ending response without a message
  }
});

// Server starts but logs contain useless information
server.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`); // Overly verbose log
  console.log("Ready to process GitHub events."); // Pointless log
});
