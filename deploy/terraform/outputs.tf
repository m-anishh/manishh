output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value     = module.eks.cluster_endpoint
  sensitive = true
}

output "ecr_repository_url" {
  value = aws_ecr_repository.portfolio.repository_url
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "load_balancer_controller_role_arn" {
  value = module.aws_load_balancer_controller_irsa.iam_role_arn
}
