import * as cdk from 'aws-cdk-lib';
import { DieYoungStayBrightStack } from '../lib/die_young_stay_bright-stack';

const app = new cdk.App();
new DieYoungStayBrightStack(app, 'DieYoungStayBrightStack');
