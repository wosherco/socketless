// "use client";

// import type { z } from "zod";
// import { useEffect, useState } from "react";
// import Link from "next/link";

// import type { ProjectEdgeLimitsSchema } from "@socketless/validators";
// import { Button } from "@socketless/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@socketless/ui/card";
// import { Checkbox } from "@socketless/ui/checkbox";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
//   useForm,
// } from "@socketless/ui/form";
// import { Input } from "@socketless/ui/input";
// import { toast } from "@socketless/ui/toast";
// import { ProjectEdgeLimitsFormSchema } from "@socketless/validators";

// import { api } from "~/trpc/react";

// export default function LimitsSettings({
//   projectId,
//   free,
//   limits,
// }: {
//   projectId: number;
//   free: boolean;
//   limits: z.infer<typeof ProjectEdgeLimitsSchema>;
// }) {
//   const limitsForm = useForm({
//     schema: ProjectEdgeLimitsFormSchema,
//     defaultValues: {
//       projectId,
//       connectionsLimited: limits.connectionsLimited,
//       connectionsLimit: limits.connectionsLimit,
//       connectionsPerChannelLimit: limits.connectionsPerChannelLimit,
//       peakConnectionsLimited: limits.peakConnectionsLimited,
//       peakConnectionsLimit: limits.peakConnectionsLimit,
//       outgoingMessagesLimited: limits.outgoingMessagesLimited,
//       outgoingMessagesLimit: limits.outgoingMessagesLimit,
//       incomingMessagesLimited: limits.incomingMessagesLimited,
//       incomingMessagesLimit: limits.incomingMessagesLimit,
//     },
//   });

//   const updateLimits = api.projectLimits.setLimits.useMutation({
//     onSuccess() {
//       toast.success("Limits updated successfully.");
//     },
//     onError() {
//       toast.error("Failed to update limits.");
//     },
//   });

//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (updateLimits.isPending) {
//       setLoading(true);
//     } else {
//       setLoading(false);
//     }
//   }, [updateLimits.isPending]);

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Limits</CardTitle>
//         <CardDescription>
//           Set Limits to your project usage, and receive notifications.
//         </CardDescription>
//       </CardHeader>
//       <Form {...limitsForm}>
//         <form
//           className="flex w-full max-w-2xl flex-col gap-4"
//           onSubmit={limitsForm.handleSubmit((data) => {
//             updateLimits.mutate(data);
//           })}
//         >
//           <CardContent>
//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="connectionsLimit"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Maximum Connections</FormLabel>
//                   <FormControl>
//                     <Input type="number" placeholder="Number" {...field} />
//                   </FormControl>
//                   <FormDescription>
//                     The maximum amount of connections allowed during the billing
//                     period.
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="connectionsLimited"
//               render={({ field }) => (
//                 <FormItem className="my-4 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                   <FormControl>
//                     <Checkbox
//                       disabled={free}
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                   <div className="space-y-1 leading-none">
//                     <FormLabel>Limit connections</FormLabel>
//                     <FormDescription>
//                       Limit the amount of connections made.
//                     </FormDescription>
//                   </div>
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={limitsForm.control}
//               name="connectionsPerChannelLimit"
//               render={({ field }) => (
//                 <FormItem className="my-4">
//                   <FormLabel>Maximum Connections Per Channel</FormLabel>
//                   <FormControl>
//                     <Input
//                       disabled
//                       type="number"
//                       placeholder="Number"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormDescription>
//                     The amount of concurrent connections that are allowed per
//                     channel.
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="peakConnectionsLimit"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Maximum Concurrent Connections</FormLabel>
//                   <FormControl>
//                     <Input type="number" placeholder="Number" {...field} />
//                   </FormControl>
//                   <FormDescription>
//                     The amount of concurrent connections that is allowed in the
//                     whole project.
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="peakConnectionsLimited"
//               render={({ field }) => (
//                 <FormItem className="my-4 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                   <FormControl>
//                     <Checkbox
//                       disabled={free}
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                   <div className="space-y-1 leading-none">
//                     <FormLabel>Limit Concurrent Connections</FormLabel>
//                     <FormDescription>
//                       Limit the amount of concurrent connections in the project.
//                     </FormDescription>
//                   </div>
//                 </FormItem>
//               )}
//             />

//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="outgoingMessagesLimit"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Amount of Outgoing Messages</FormLabel>
//                   <FormControl>
//                     <Input type="number" placeholder="Number" {...field} />
//                   </FormControl>
//                   <FormDescription>
//                     The amount of outgoing messages (published messages to
//                     channels) that is allowed.
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="outgoingMessagesLimited"
//               render={({ field }) => (
//                 <FormItem className="my-4 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                   <FormControl>
//                     <Checkbox
//                       disabled={free}
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                   <div className="space-y-1 leading-none">
//                     <FormLabel>Limit Outgoing Messages</FormLabel>
//                     <FormDescription>
//                       Limit the amount of messages that can be publish in the
//                       whole project.
//                     </FormDescription>
//                   </div>
//                 </FormItem>
//               )}
//             />

//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="incomingMessagesLimit"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Amount of Incoming Messages</FormLabel>
//                   <FormControl>
//                     <Input type="number" placeholder="Number" {...field} />
//                   </FormControl>
//                   <FormDescription>
//                     The amount of incoming messages that is allowed.
//                   </FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               disabled={free}
//               control={limitsForm.control}
//               name="incomingMessagesLimited"
//               render={({ field }) => (
//                 <FormItem className="mt-4 flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
//                   <FormControl>
//                     <Checkbox
//                       disabled={free}
//                       checked={field.value}
//                       onCheckedChange={field.onChange}
//                     />
//                   </FormControl>
//                   <div className="space-y-1 leading-none">
//                     <FormLabel>Limit Incoming Messages</FormLabel>
//                     <FormDescription>
//                       Limit the amount of messages that can be sent by
//                       websockets in the whole project.
//                     </FormDescription>
//                   </div>
//                 </FormItem>
//               )}
//             />
//           </CardContent>
//           <CardFooter className="flex flex-col items-start justify-start gap-2">
//             <Button disabled={free || loading} type="submit">
//               Update
//             </Button>

//             {free && (
//               <p className="text-xs text-muted-foreground">
//                 You can't modify the limits because you're in the free plan.
//                 Updated on the{" "}
//                 <Link className="text-primary underline" href="/billing">
//                   billing page
//                 </Link>{" "}
//                 to remove this limitation.
//               </p>
//             )}
//           </CardFooter>
//         </form>
//       </Form>
//     </Card>
//   );
// }
