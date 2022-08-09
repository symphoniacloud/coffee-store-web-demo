import {App, Fn, StackProps} from "aws-cdk-lib";
import {BehaviorOptions, CachePolicy} from "aws-cdk-lib/aws-cloudfront";
import {WebsiteCustomDomain} from "@symphoniacloud/cdk-website";
import {createStackProps} from "./initSupport";

export interface CoffeeStoreWebDemoStackProps extends StackProps {
    customDomain: WebsiteCustomDomain
    performCacheInvalidation?: boolean
    additionalDefaultBehaviorOptions?: Omit<BehaviorOptions, 'origin'>;
}

const CoffeeStoreWebDemoStackPropsPerEnv: Record<string, CoffeeStoreWebDemoStackProps> = {
    // Opensource account - this is this demo's "prod" account
    '073101298092': {
        customDomain: {
            // For this demo we want to serve in production on both the "apex" domain, and "www."
            domains: [{
                domainName: 'coffeestorewebdemo.symphonia.io',
                hostedZone: {fromDomainName: 'coffeestorewebdemo.symphonia.io'},
            }, {
                domainName: 'www.coffeestorewebdemo.symphonia.io',
                hostedZone: {fromDomainName: 'coffeestorewebdemo.symphonia.io'},
            }],
            // The certificate is deployed in a different stack, and the ARN is exported, which we import here
            certificate: {fromArn: Fn.importValue('CoffeeStoreWebDemoCertificate')}
        },
        // In production we want to invalidate the CloudFront cache in this demo - you might not want the same
        // behavior since for frequent deployments this may cost money
        performCacheInvalidation: true
    },
    // Test
    '443780941070': {
        // For test and development we only serve on one domain name because of a shared DNS hosted zone
        customDomain: {
            domainName: 'coffeestorewebdemo.test.symphonia.io',
            hostedZone: {fromDomainName: 'test.symphonia.io'},
            certificate: {fromArn: Fn.importValue('StandardCertificate')}
        },
        // In test and dev we don't invalidate, but we also turn off all caching behavior
        additionalDefaultBehaviorOptions: {
            cachePolicy: CachePolicy.CACHING_DISABLED
        }
    },
    // Mike's dev account - this models an "account per development" strategy
    '397589511426': {
        customDomain: {
            domainName: 'coffeestorewebdemo.mike.symphonia.io',
            hostedZone: {fromDomainName: 'mike.symphonia.io'},
            certificate: {fromArn: Fn.importValue('StandardCertificate')},
        },
        additionalDefaultBehaviorOptions: {
            cachePolicy: CachePolicy.CACHING_DISABLED
        }
    },
}

export function createCoffeeStoreWebDemoStackProps(app: App, defaultStackName: string): CoffeeStoreWebDemoStackProps {
    const baseStackProps = createStackProps(app, defaultStackName),
        account = baseStackProps.env.account,
        appProps = CoffeeStoreWebDemoStackPropsPerEnv[account]

    if (!appProps)
        throw new Error(`No env props for account ${account}`)

    return { ...baseStackProps, ...appProps }
}