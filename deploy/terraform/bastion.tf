# ---------------------------------------------------------------------------
# Bastion host for SSH access to the private EKS nodes.
#
# The worker nodes live in private subnets with no public IP. To reach them
# over SSH you hop through this bastion, which sits in a public subnet:
#
#   your PowerShell  ──SSH──▶  bastion (public)  ──SSH──▶  node (private)
#
# ---------------------------------------------------------------------------

# A freshly generated SSH key pair. The private key is written to a local
# .pem file (git-ignored) that you use with ssh -i.
resource "tls_private_key" "bastion" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "bastion" {
  key_name   = "${var.project_name}-bastion"
  public_key = tls_private_key.bastion.public_key_openssh
}

resource "local_sensitive_file" "bastion_key" {
  content         = tls_private_key.bastion.private_key_pem
  filename        = "${path.module}/${var.project_name}-bastion.pem"
  file_permission = "0400"
}

# Latest Amazon Linux 2023 AMI for the bastion.
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# Security group: allow SSH to the bastion only from your IP.
resource "aws_security_group" "bastion" {
  name_prefix = "${var.project_name}-bastion-"
  description = "SSH access to the bastion host"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "SSH from allowed IPs (home + office)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-bastion" }
}

# The bastion instance itself (small, cheap, in the first public subnet).
resource "aws_instance" "bastion" {
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = "t3.micro"
  subnet_id                   = module.vpc.public_subnets[0]
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  key_name                    = aws_key_pair.bastion.key_name
  associate_public_ip_address = true

  tags = { Name = "${var.project_name}-bastion" }
}

# Allow the private nodes to accept SSH from the bastion's security group.
resource "aws_security_group_rule" "nodes_ssh_from_bastion" {
  type                     = "ingress"
  description              = "SSH from bastion"
  from_port                = 22
  to_port                  = 22
  protocol                 = "tcp"
  security_group_id        = module.eks.node_security_group_id
  source_security_group_id = aws_security_group.bastion.id
}

output "bastion_public_ip" {
  description = "Public IP of the bastion host."
  value       = aws_instance.bastion.public_ip
}

output "bastion_ssh_command" {
  description = "SSH into the bastion."
  value       = "ssh -i ${var.project_name}-bastion.pem ec2-user@${aws_instance.bastion.public_ip}"
}
