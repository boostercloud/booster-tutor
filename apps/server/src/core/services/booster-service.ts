import { gql, GraphQLClient } from "graphql-request";

export enum CompletionStatus {
  Pending = "Pending",
  Completed = "Completed",
  Failed = "Failed",
}

export enum ReactionStatus {
  Upvoted = "Upvoted",
  Downvoted = "Downvoted",
}

interface AskQuestionResponse {
  AskQuestion: string;
}

interface AnswerQuestionInput {
  questionID: string;
  answer: string;
  status: CompletionStatus;
}

interface AnswerQuestionResponse {
  AnswerQuestion: boolean;
}

interface ReactAnswerInput {
  questionID: string;
  reaction: ReactionStatus;
}

interface ReactAnswerResponse {
  ReactAnswer: boolean;
}

export class BoosterService {
  private client: GraphQLClient;

  constructor(endpoint: string) {
    this.client = new GraphQLClient(endpoint, { fetch });
  }

  async askQuestion(question: string): Promise<string> {
    const mutation = gql`
      mutation AskQuestion($question: String!) {
        AskQuestion(input: { question: $question })
      }
    `;

    const variables = { question };

    const response = await this.client.request<AskQuestionResponse>(
      mutation,
      variables
    );
    return response.AskQuestion;
  }

  async answerQuestion(
    questionID: string,
    answer: string,
    status: CompletionStatus
  ): Promise<boolean> {
    const mutation = gql`
      mutation AnswerQuestion($input: AnswerQuestionInput!) {
        AnswerQuestion(input: $input)
      }
    `;

    const variables: { input: AnswerQuestionInput } = {
      input: {
        questionID,
        answer,
        status: status,
      },
    };

    const response = await this.client.request<AnswerQuestionResponse>(
      mutation,
      variables
    );
    return response.AnswerQuestion;
  }

  async reactToAnswer(
    questionID: string,
    reaction: ReactionStatus
  ): Promise<boolean> {
    const mutation = gql`
      mutation ReactAnswer($input: ReactAnswerInput!) {
        ReactAnswer(input: $input)
      }
    `;

    const variables: { input: ReactAnswerInput } = {
      input: {
        questionID,
        reaction: reaction,
      },
    };

    const response = await this.client.request<ReactAnswerResponse>(
      mutation,
      variables
    );
    return response.ReactAnswer;
  }
}
