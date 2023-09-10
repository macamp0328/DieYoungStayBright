import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class DieYoungStayBrightStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table for storing history of actions
    const historyTable = new Table(this, 'HistoryTable', {
      partitionKey: {
        name: 'timestamp',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY, // Only for dev/test environments
    });

    // Create a Lambda function to handle IoT messages and interact with DynamoDB
    const iotHandler = new Function(this, 'IoTHandler', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambda-functions/handleIoT'),
      handler: 'index.handler',
      environment: {
        HISTORY_TABLE_NAME: historyTable.tableName,
      },
    });

    // Grant the Lambda function permissions to write to the DynamoDB table
    historyTable.grantWriteData(iotHandler);

    // Create an IoT Topic Rule
    new CfnTopicRule(this, 'IoTTopicRule', {
      ruleName: 'DieYoungStayBrightRule',
      topicRulePayload: {
        sql: "SELECT * FROM 'some/iot/topic'",
        ruleDisabled: false,
        actions: [
          {
            lambda: {
              functionArn: iotHandler.functionArn,
            },
          },
        ],
      },
    });

    // Grant the IoT service permission to invoke the Lambda function
    iotHandler.addPermission('AllowIot', {
      principal: new ServicePrincipal('iot.amazonaws.com'),
    });
  }
}
