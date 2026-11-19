# Portfolio AWS infrastructure

This Terraform stack provisions the architecture:

`GitHub Actions -> ECR -> EKS -> AWS Load Balancer -> portfolio website`

It creates a VPC, public/private subnets, a NAT gateway, an EKS cluster with
managed nodes, an immutable/scanned ECR repository, GitHub Actions OIDC access,
and the AWS Load Balancer Controller.

## Usage

1. Copy `terraform.tfvars.example` to `terraform.tfvars`.
2. Set `domain_name` and the exact GitHub `owner/repository`.
3. Run:

```bash
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan
terraform apply
```

EKS and the NAT gateway create ongoing AWS charges. Review `terraform plan`
before applying. After apply, configure these GitHub repository values:

- Secret `AWS_DEPLOY_ROLE_ARN`: Terraform output `github_actions_role_arn`
- Variable `AWS_REGION`: Terraform variable `aws_region`
- Variable `ECR_REPOSITORY`: `portfolio`
- Variable `EKS_CLUSTER_NAME`: Terraform output `cluster_name`
- Variable `DOMAIN`: the deployed hostname
- Variable `CERTIFICATE_ARN`: ACM certificate ARN for the hostname

The ACM certificate must exist in the same AWS region as the ALB. The current
Kubernetes manifest expects that certificate ARN and hostname.
