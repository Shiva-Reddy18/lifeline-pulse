import { motion } from 'framer-motion';
import { 
  User, 
  Droplet, 
  Hospital, 
  Building2, 
  Truck, 
  Shield,
  CheckCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export type UserRoleType = 'patient' | 'donor' | 'hospital_staff' | 'blood_bank' | 'volunteer' | 'admin';

interface RoleOption {
  id: UserRoleType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'patient',
    title: 'Patient / Attender',
    description: 'Request emergency blood assistance',
    icon: User,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    id: 'donor',
    title: 'Blood Donor',
    description: 'Donate blood and save lives',
    icon: Droplet,
    color: 'text-[hsl(var(--status-critical))]',
    bgColor: 'bg-[hsl(var(--status-critical)/0.1)]'
  },
  {
    id: 'hospital_staff',
    title: 'Hospital Staff',
    description: 'Manage emergencies at your hospital',
    icon: Hospital,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10'
  },
  // {
  //   id: 'blood_bank',
  //   title: 'Blood Bank',
  //   description: 'Manage blood inventory and requests',
  //   icon: Building2,
  //   color: 'text-[hsl(var(--blood-ab))]',
  //   bgColor: 'bg-[hsl(var(--blood-ab)/0.1)]'
  // },
  // {
  //   id: 'volunteer',
  //   title: 'Volunteer / Transport',
  //   description: 'Help transport blood to patients',
  //   icon: Truck,
  //   color: 'text-[hsl(var(--status-stable))]',
  //   bgColor: 'bg-[hsl(var(--status-stable)/0.1)]'
  // },
//   {
//     id: 'admin',
//     title: 'Admin / Authority',
//     description: 'System oversight and verification',
//     icon: Shield,
//     color: 'text-[hsl(var(--status-warning))]',
//     bgColor: 'bg-[hsl(var(--status-warning)/0.1)]'
//   }
];

interface RoleSelectorProps {
  selectedRole: UserRoleType | null;
  onSelectRole: (role: UserRoleType) => void;
}

export function RoleSelector({ selectedRole, onSelectRole }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {roleOptions.map((role, index) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;
        
        return (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              variant={isSelected ? 'emergency' : 'elevated'}
              className={`relative p-4 cursor-pointer transition-all hover:shadow-lg ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onSelectRole(role.id)}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}
              
              <div className={`w-12 h-12 rounded-xl ${role.bgColor} flex items-center justify-center mb-3`}>
                <Icon className={`w-6 h-6 ${role.color}`} />
              </div>
              
              <h3 className="font-semibold text-sm mb-1">{role.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {role.description}
              </p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export { roleOptions };
